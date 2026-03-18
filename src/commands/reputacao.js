// ================================
// INÍCIO - reputacao.js
// ================================

import fs from "fs";
import path from "path";

const PATH_DB = path.resolve("src/data/reputacao.json");

// ================================
// GARANTE ARQUIVO
// ================================
function ensureDB() {
  if (!fs.existsSync(PATH_DB)) {
    fs.writeFileSync(PATH_DB, JSON.stringify({}, null, 2));
  }
}

// ================================
// LOAD / SAVE
// ================================
function loadDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(PATH_DB, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(PATH_DB, JSON.stringify(db, null, 2));
}

// ================================
// EXTRAIR VCARD
// ================================
function extrairContato(msg) {
  let contato = null;

  if (msg.message?.contactMessage) {
    contato = msg.message.contactMessage;
  }

  if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.contactMessage) {
    contato =
      msg.message.extendedTextMessage.contextInfo.quotedMessage.contactMessage;
  }

  if (!contato) return null;

  const numero = contato.vcard.match(/waid=(\d+)/)?.[1];

  return {
    numero,
    nome: contato.displayName || "Sem nome",
  };
}

// ================================
// BASE GENÉRICA (CADASTRO)
// ================================
async function processar(msg, tipo, textoMotivo) {
  const contato = extrairContato(msg);

  if (!contato || !contato.numero) {
    return { texto: "Responda um contato (vCard)." };
  }

  const db = loadDB();

  if (!db[contato.numero]) {
    db[contato.numero] = {
      nome: contato.nome,
      referencias: [],
      alertas: [],
      redflags: [],
    };
  }

  const registro = {
    texto: textoMotivo || "Sem descrição",
    autor: (msg.key.participant || msg.key.remoteJid).replace(/@.*/, ""),
    grupo: msg.key.remoteJid,
    data: Date.now(),
  };

  if (tipo === "ref") db[contato.numero].referencias.push(registro);
  if (tipo === "alerta") db[contato.numero].alertas.push(registro);
  if (tipo === "redflag") db[contato.numero].redflags.push(registro);

  saveDB(db);

  return {
    texto: `✅ Registro salvo para ${contato.nome}`,
  };
}

// ================================
// CONSULTA COMPLETA
// ================================
function formatarDados(numero, dados) {
  let txt = `👤 ${dados.nome}\n📱 +${numero}\n\n`;

  if (dados.referencias.length) {
    txt += "⭐ Referências:\n";
    dados.referencias.forEach(r => {
      txt += `- ${r.texto}\n`;
    });
    txt += "\n";
  }

  if (dados.alertas.length) {
    txt += "⚠️ Alertas:\n";
    dados.alertas.forEach(a => {
      txt += `- ${a.texto}\n`;
    });
    txt += "\n";
  }

  if (dados.redflags.length) {
    txt += "🚫 Red Flags:\n";
    dados.redflags.forEach(r => {
      txt += `- ${r.texto}\n`;
    });
    txt += "\n";
  }

  if (
    !dados.referencias.length &&
    !dados.alertas.length &&
    !dados.redflags.length
  ) {
    txt += "Sem registros.";
  }

  return txt;
}

// ================================
// STATUS (RESUMO + SCORE)
// ================================
function calcularStatus(numero, dados) {
  const pos = dados.referencias.length;
  const neg = dados.alertas.length;
  const red = dados.redflags.length;

  const score = pos - neg * 2 - red * 5;

  let nivel = "NEUTRO";

  if (score >= 3) nivel = "CONFIÁVEL ✅";
  if (score < 0) nivel = "RISCO ⚠️";
  if (score <= -5) nivel = "ALTO RISCO 🚨";

  return `👤 ${dados.nome}
📱 +${numero}

⭐ ${pos} referências
⚠️ ${neg} alertas
🚫 ${red} redflags

📊 Score: ${score}
Status: ${nivel}`;
}

// ================================
// COMANDOS DE CADASTRO
// ================================
export async function addRef(msg, sock, from, args) {
  return processar(msg, "ref", args.join(" "));
}

export async function addAlerta(msg, sock, from, args) {
  return processar(msg, "alerta", args.join(" "));
}

export async function addRedflag(msg, sock, from, args) {
  return processar(msg, "redflag", args.join(" "));
}

// ================================
// COMANDO !dados
// ================================
export async function dados(msg) {
  const contato = extrairContato(msg);

  if (!contato || !contato.numero) {
    return { texto: "Responda um contato (vCard)." };
  }

  const db = loadDB();
  const dados = db[contato.numero];

  if (!dados) {
    return { texto: "Nenhum registro encontrado." };
  }

  return {
    texto: formatarDados(contato.numero, dados),
  };
}

// ================================
// COMANDO !status
// ================================
export async function status(msg) {
  const contato = extrairContato(msg);

  if (!contato || !contato.numero) {
    return { texto: "Responda um contato (vCard)." };
  }

  const db = loadDB();
  const dados = db[contato.numero];

  if (!dados) {
    return { texto: "Nenhum registro encontrado." };
  }

  return {
    texto: calcularStatus(contato.numero, dados),
  };
}

// ================================
// FIM - reputacao.js
// ================================