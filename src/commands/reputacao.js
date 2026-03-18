// ================================
// INÍCIO - reputacao LGPD SAFE
// ================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

const PATH_DB = path.resolve("src/data/reputacao.json");

// ================================
// CONFIG
// ================================
const LIMITE_DIAS = 60;
const SALT = process.env.SALT_SECRETO || "salt_forte_aqui";

// ================================
// GARANTE DB
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
// HASH POR GRUPO (ANTI-RADAR)
// ================================
function hashNumero(numero, grupo) {
  return crypto
    .createHash("sha256")
    .update(numero + grupo + SALT)
    .digest("hex");
}

// ================================
// LIMPEZA AUTOMÁTICA
// ================================
function limpar(registros) {
  const agora = Date.now();
  return registros.filter(r => agora - r.data < LIMITE_DIAS * 86400000);
}

// ================================
// EXTRATOR (igual ao seu)
// ================================
function extrairNumerosUniversal(msg) {
  const numeros = new Set();
  let m = msg.message;

  if (m?.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m?.viewOnceMessage) m = m.viewOnceMessage.message;

  const pegarNumero = (vcard) => {
    if (!vcard) return;
    let match = vcard.match(/waid=(\d+)/);
    if (match) return numeros.add(match[1]);

    const nums = vcard.match(/\d{10,15}/g);
    if (nums) nums.forEach(n => numeros.add(n));
  };

  if (m?.contactMessage) pegarNumero(m.contactMessage.vcard);

  if (m?.contactsArrayMessage) {
    for (const c of m.contactsArrayMessage.contacts) {
      pegarNumero(c.vcard);
    }
  }

  const texto =
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    "";

  const encontrados = texto.match(/\d{10,15}/g);
  if (encontrados) encontrados.forEach(n => numeros.add(n));

  return [...numeros];
}

// ================================
// PROCESSAR (ISOLADO POR GRUPO)
// ================================
async function processar(msg, tipo, textoMotivo) {
  const numeros = extrairNumerosUniversal(msg);
  if (!numeros.length) return { texto: "Nenhum número encontrado." };

  const db = loadDB();
  const grupo = msg.key.remoteJid;

  if (!db[grupo]) db[grupo] = {};

  for (const numero of numeros) {
    const id = hashNumero(numero, grupo);

    if (!db[grupo][id]) {
      db[grupo][id] = {
        referencias: [],
        alertas: [],
        redflags: []
      };
    }

    const registro = {
      texto: textoMotivo || "Sem descrição",
      data: Date.now()
    };

    db[grupo][id][tipo].push(registro);

    // limpeza
    db[grupo][id][tipo] = limpar(db[grupo][id][tipo]);
  }

  saveDB(db);

  return { texto: `✅ Aplicado em ${numeros.length} usuário(s)` };
}

// ================================
// STATUS
// ================================
function calcularStatus(dados) {
  const pos = dados.referencias.length;
  const neg = dados.alertas.length;
  const red = dados.redflags.length;

  const score = pos - neg * 2 - red * 5;

  let nivel = "NEUTRO";
  if (score >= 3) nivel = "CONFIÁVEL ✅";
  if (score < 0) nivel = "RISCO ⚠️";
  if (score <= -5) nivel = "ALTO RISCO 🚨";

  return { pos, neg, red, score, nivel };
}

// ================================
// DADOS
// ================================
export async function dados(msg) {
  const numeros = extrairNumerosUniversal(msg);
  if (!numeros.length) return { texto: "Nenhum número encontrado." };

  const db = loadDB();
  const grupo = msg.key.remoteJid;

  if (!db[grupo]) return { texto: "Nenhum registro encontrado." };

  const id = hashNumero(numeros[0], grupo);
  const dados = db[grupo][id];

  if (!dados) return { texto: "Nenhum registro encontrado." };

  const status = calcularStatus(dados);

  return {
    texto: `📊 Histórico no grupo

⭐ ${status.pos} referências
⚠️ ${status.neg} alertas
🚫 ${status.red} redflags

Score: ${status.score}
Status: ${status.nivel}

⚠️ Sistema interno do grupo`
  };
}

// ================================
// COMANDOS
// ================================
export async function addRef(msg, sock, from, args) {
  return processar(msg, "referencias", args.join(" "));
}

export async function addAlerta(msg, sock, from, args) {
  return processar(msg, "alertas", args.join(" "));
}

export async function addRedflag(msg, sock, from, args) {
  return processar(msg, "redflags", args.join(" "));
}

// ================================
// FIM
// ================================