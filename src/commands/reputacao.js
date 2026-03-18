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

  // ============================
  // 🔥 REPLY
  // ============================
  const quoted = m?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) {
    numeros.add(quoted.replace(/\D/g, ""));
  }

  // ============================
  // 🔥 FUNÇÃO UNIVERSAL VCARD
  // ============================
  const extrairDeVcard = (vcard) => {
    if (!vcard) return;

    // pega QUALQUER sequência numérica grande
    const encontrados = vcard.match(/\d{10,20}/g);
    if (encontrados) {
      encontrados.forEach(n => numeros.add(n));
    }
  };

  // ============================
  // 🔥 CONTATO ÚNICO
  // ============================
  if (m?.contactMessage?.vcard) {
    extrairDeVcard(m.contactMessage.vcard);
  }

  // ============================
  // 🔥 MÚLTIPLOS CONTATOS (AQUI TAVA O BO)
  // ============================
  if (m?.contactsArrayMessage?.contacts?.length) {
    for (const contato of m.contactsArrayMessage.contacts) {
      extrairDeVcard(contato.vcard);
    }
  }

  // ============================
  // 🔥 TEXTO NORMAL
  // ============================
  const texto =
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    "";

  const numsTexto = texto.match(/\d{10,20}/g);
  if (numsTexto) {
    numsTexto.forEach(n => numeros.add(n));
  }

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
// FIM
// ================================