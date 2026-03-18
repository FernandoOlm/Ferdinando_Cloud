// ================================
// INÍCIO - reputacao.js FINAL FLEX
// ================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

const PATH_DB = path.resolve("src/data/reputacao.json");
const SALT = process.env.SALT_SECRETO || "salt_forte_aqui";

// ================================
// DB
// ================================
function ensureDB() {
  if (!fs.existsSync(PATH_DB)) {
    fs.writeFileSync(PATH_DB, JSON.stringify({}, null, 2));
  }
}

function loadDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(PATH_DB, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(PATH_DB, JSON.stringify(db, null, 2));
}

// ================================
// HASH LGPD
// ================================
function hashNumero(numero, grupo) {
  return crypto
    .createHash("sha256")
    .update(numero + grupo + SALT)
    .digest("hex");
}

// ================================
// EXTRATOR (reply + texto + vcard)
// ================================
function extrairNumerosUniversal(msg) {
  const numeros = new Set();

  let m = msg.message;

  if (m?.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m?.viewOnceMessage) m = m.viewOnceMessage.message;

  // DEBUG (se quiser ver o formato real)
  // console.log(JSON.stringify(m, null, 2));

  const extrairTudo = (texto) => {
    if (!texto) return;

    const encontrados = texto.match(/\d{10,20}/g);
    if (encontrados) {
      encontrados.forEach(n => numeros.add(n));
    }
  };

  // ============================
  // 🔥 1. contactsArrayMessage (LISTA REAL)
  // ============================
  if (m?.contactsArrayMessage?.contacts) {
    for (const contato of m.contactsArrayMessage.contacts) {
      extrairTudo(contato.vcard);
    }
  }

  // ============================
  // 🔥 2. contactMessage (PODE VIR 1 OU VÁRIOS EMBUTIDOS)
  // ============================
  if (m?.contactMessage?.vcard) {
    extrairTudo(m.contactMessage.vcard);
  }

  // ============================
  // 🔥 3. CONTEXT (ENCAMINHADO)
  // ============================
  const context = m?.extendedTextMessage?.contextInfo;

  if (context?.quotedMessage?.contactMessage?.vcard) {
    extrairTudo(context.quotedMessage.contactMessage.vcard);
  }

  if (context?.quotedMessage?.contactsArrayMessage?.contacts) {
    for (const c of context.quotedMessage.contactsArrayMessage.contacts) {
      extrairTudo(c.vcard);
    }
  }

  // ============================
  // 🔥 4. TEXTO (fallback)
  // ============================
  const texto =
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    "";

  extrairTudo(texto);

  return [...numeros];
}
// ================================
// BASE
// ================================
function criarBase() {
  return {
    ban: [],
    redflag: []
  };
}

// ================================
// BANIR (motivo livre)
// ================================
export async function banir(msg, sock, from, args) {
  try {
    if (!msg.key.remoteJid.includes("@g.us")) {
      return { texto: "❌ Apenas em grupo." };
    }

    const motivo = args?.join(" ")?.trim();

    if (!motivo) {
      return { texto: "❌ Use: !banir [motivo]" };
    }

    const numeros = extrairNumerosUniversal(msg);

    if (!numeros.length) {
      return { texto: "❌ Nenhum número encontrado." };
    }

    const db = loadDB();
    const grupo = msg.key.remoteJid;

    if (!db[grupo]) db[grupo] = {};

    let total = 0;

    for (const numero of numeros) {
      const id = hashNumero(numero, grupo);

      if (!db[grupo][id]) {
        db[grupo][id] = criarBase();
      }

      const lista = db[grupo][id].ban;

      lista.push({
        motivo,
        autor: from,
        data: Date.now()
      });

      if (lista.length > 20) lista.shift();

      total++;
    }

    saveDB(db);

    return {
      texto: `🚫 ${total} marcado(s): ${motivo}`
    };

  } catch (err) {
    console.log("ERRO BANIR:", err);
    return { texto: "❌ Erro." };
  }
}

// ================================
// RED FLAG (leve)
// ================================
export async function redFlag(msg, sock, from, args) {
  try {
    const motivo = args?.join(" ")?.trim();

    if (!motivo) {
      return { texto: "❌ Use: !red-flag [motivo]" };
    }

    const numeros = extrairNumerosUniversal(msg);

    if (!numeros.length) {
      return { texto: "❌ Nenhum número encontrado." };
    }

    const db = loadDB();
    const grupo = msg.key.remoteJid;

    if (!db[grupo]) db[grupo] = {};

    let total = 0;

    for (const numero of numeros) {
      const id = hashNumero(numero, grupo);

      if (!db[grupo][id]) {
        db[grupo][id] = criarBase();
      }

      const lista = db[grupo][id].redflag;

      lista.push({
        motivo,
        autor: from,
        data: Date.now()
      });

      if (lista.length > 20) lista.shift();

      total++;
    }

    saveDB(db);

    return {
      texto: `🚩 ${total} alerta(s): ${motivo}`
    };

  } catch (err) {
    console.log("ERRO REDFLAG:", err);
    return { texto: "❌ Erro." };
  }
}

// ================================
// STATUS
// ================================
export async function status(msg, sock, from, args) {
  try {
    const numeros = extrairNumerosUniversal(msg);

    if (!numeros.length) {
      return { texto: "❌ Nenhum número encontrado." };
    }

    const db = loadDB();
    const grupo = msg.key.remoteJid;

    const id = hashNumero(numeros[0], grupo);
    const dados = db?.[grupo]?.[id];

    if (!dados) {
      return { texto: "Nenhum registro." };
    }

    const bans = dados.ban.length;
    const flags = dados.redflag.length;

    let nivel = "OK";

    if (bans > 0) nivel = "🚨 BANIDO";
    else if (flags >= 3) nivel = "⚠️ ALTO RISCO";
    else if (flags > 0) nivel = "⚠️ ATENÇÃO";

    return {
      texto: `📊 Status do usuário

🚫 Bans: ${bans}
🚩 Alertas: ${flags}

Status: ${nivel}`
    };

  } catch (err) {
    console.log("ERRO STATUS:", err);
    return { texto: "❌ Erro." };
  }
}

// ================================
// CLEAN REPUTAÇÃO (ROOT ONLY)
// ================================
export async function cleanRep(msg, sock, from, args) {
  try {
    const ROOT = process.env.ROOT_ID;

    if (from !== ROOT) {
      return { texto: "❌ Apenas o root pode usar esse comando." };
    }

    const PATH_DB = path.resolve("src/data/reputacao.json");

    // reseta o arquivo
    fs.writeFileSync(PATH_DB, JSON.stringify({}, null, 2));

    return {
      texto: "🧹 Reputação limpa com sucesso."
    };

  } catch (err) {
    console.log("ERRO CLEAN REP:", err);
    return { texto: "❌ Erro ao limpar reputação." };
  }
}

// ================================
// FIM
// ================================