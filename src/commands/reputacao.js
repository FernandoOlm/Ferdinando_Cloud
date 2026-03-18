// ================================
// INÍCIO - reputacao.js FINAL
// ================================

import fs from "fs";
import path from "path";

const PATH_DB = path.resolve("src/data/reputacao.json");
const PATH_BANS = path.resolve("src/data/bans.json");

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
// 🔥 EXTRATOR UNIVERSAL
// ================================
function extrairNumerosUniversal(msg) {
  const numeros = new Set();

  // contato direto
  if (msg.message?.contactMessage) {
    const v = msg.message.contactMessage.vcard;
    const m = v.match(/waid=(\d+)/);
    if (m) numeros.add(m[1]);
  }

  // contato citado
  if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.contactMessage) {
    const v =
      msg.message.extendedTextMessage.contextInfo.quotedMessage.contactMessage.vcard;
    const m = v.match(/waid=(\d+)/);
    if (m) numeros.add(m[1]);
  }

  // múltiplos contatos
  if (msg.message?.contactsArrayMessage) {
    for (const c of msg.message.contactsArrayMessage.contacts) {
      const m = c.vcard.match(/waid=(\d+)/);
      if (m) numeros.add(m[1]);
    }
  }

  // texto manual
  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const encontrados = texto.match(/\d{10,15}/g);
  if (encontrados) {
    encontrados.forEach(n => numeros.add(n));
  }

  return [...numeros];
}

// ================================
// CADASTRO EM MASSA
// ================================
async function processar(msg, tipo, textoMotivo) {
  const numeros = extrairNumerosUniversal(msg);

  if (!numeros.length) {
    return { texto: "Nenhum número encontrado." };
  }

  const db = loadDB();

  for (const numero of numeros) {
    if (!db[numero]) {
      db[numero] = {
        nome: "Desconhecido",
        referencias: [],
        alertas: [],
        redflags: []
      };
    }

    const registro = {
      texto: textoMotivo || "Sem descrição",
      autor: (msg.key.participant || msg.key.remoteJid).replace(/@.*/, ""),
      grupo: msg.key.remoteJid,
      data: Date.now()
    };

    if (tipo === "ref") db[numero].referencias.push(registro);
    if (tipo === "alerta") db[numero].alertas.push(registro);
    if (tipo === "redflag") db[numero].redflags.push(registro);
  }

  saveDB(db);

  return {
    texto: `✅ Operação aplicada em ${numeros.length} usuários`
  };
}

// ================================
// FORMATADORES
// ================================
function formatarDados(numero, dados) {
  let txt = `👤 ${dados.nome}\n📱 +${numero}\n\n`;

  if (dados.referencias.length) {
    txt += "⭐ Referências:\n";
    dados.referencias.forEach(r => (txt += `- ${r.texto}\n`));
    txt += "\n";
  }

  if (dados.alertas.length) {
    txt += "⚠️ Alertas:\n";
    dados.alertas.forEach(a => (txt += `- ${a.texto}\n`));
    txt += "\n";
  }

  if (dados.redflags.length) {
    txt += "🚫 Red Flags:\n";
    dados.redflags.forEach(r => (txt += `- ${r.texto}\n`));
    txt += "\n";
  }

  if (!dados.referencias.length && !dados.alertas.length && !dados.redflags.length) {
    txt += "Sem registros.";
  }

  return txt;
}

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
// BANIMENTO EM MASSA
// ================================
export async function banirVcard(msg, sock, from, args) {
  const numeros = extrairNumerosUniversal(msg);

  if (!numeros.length) {
    return { texto: "Nenhum número encontrado." };
  }

  const db = JSON.parse(fs.readFileSync(PATH_BANS, "utf8"));

  const motivo = args.join(" ") || "Sem motivo informado";
  const admin = (msg.key.participant || msg.key.remoteJid).replace(/@.*/, "");
  const grupo = msg.key.remoteJid;

  let novos = 0;
  let repetidos = 0;

  for (const numero of numeros) {
    const existe = db.global.some(b => b.alvo === numero);

    if (existe) {
      repetidos++;
      continue;
    }

    db.global.push({
      alvo: numero,
      admin,
      grupoOrigem: grupo,
      motivo,
      data: Date.now()
    });

    novos++;
  }

  fs.writeFileSync(PATH_BANS, JSON.stringify(db, null, 2));

  return {
    texto: `🚫 Banimento concluído\n\n✅ ${novos} novos\n⚠️ ${repetidos} já existiam`
  };
}

// ================================
// COMANDOS
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
// CONSULTA
// ================================
export async function dados(msg) {
  const numeros = extrairNumerosUniversal(msg);

  if (!numeros.length) {
    return { texto: "Nenhum número encontrado." };
  }

  const db = loadDB();
  const numero = numeros[0];

  if (!db[numero]) {
    return { texto: "Nenhum registro encontrado." };
  }

  return {
    texto: formatarDados(numero, db[numero])
  };
}

export async function status(msg) {
  const numeros = extrairNumerosUniversal(msg);

  if (!numeros.length) {
    return { texto: "Nenhum número encontrado." };
  }

  const db = loadDB();
  const numero = numeros[0];

  if (!db[numero]) {
    return { texto: "Nenhum registro encontrado." };
  }

  return {
    texto: calcularStatus(numero, db[numero])
  };
}

// ================================
// FIM - reputacao.js
// ================================