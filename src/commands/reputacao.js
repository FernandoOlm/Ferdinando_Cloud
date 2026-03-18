// ================================
// INÍCIO - reputacao.js FINAL SIMPLES
// ================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

const PATH_DB = path.resolve("src/data/reputacao.json");
const LIMITE_DIAS = 60;
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
// HASH
// ================================
function hashNumero(numero, grupo) {
  return crypto
    .createHash("sha256")
    .update(numero + grupo + SALT)
    .digest("hex");
}

// ================================
// LIMPEZA
// ================================
function limpar(lista) {
  const agora = Date.now();
  return lista.filter(r => agora - r.data < LIMITE_DIAS * 86400000);
}

// ================================
// EXTRATOR
// ================================
function extrairNumerosUniversal(msg) {
  const numeros = new Set();

  let m = msg.message;

  if (m?.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m?.viewOnceMessage) m = m.viewOnceMessage.message;

  // ============================
  // PEGAR DE REPLY
  // ============================
  const quoted = m?.extendedTextMessage?.contextInfo?.participant;
  if (quoted) {
    numeros.add(quoted.replace(/\D/g, ""));
  }

  // ============================
  // VCARD
  // ============================
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

  // ============================
  // TEXTO
  // ============================
  const texto =
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    "";

  const encontrados = texto.match(/\d{10,15}/g);
  if (encontrados) encontrados.forEach(n => numeros.add(n));

  return [...numeros];
}
// ================================
// BASE
// ================================
function criarBase() {
  return {
    golpista: [],
    nao_pagou_leilao: [],
    referencias_falsas: [],
    comportamento: []
  };
}

const CATEGORIAS = {
  golpista: "golpista",
  "nao-paga": "nao_pagou_leilao",
  "ref-falsa": "referencias_falsas",
  comportamento: "comportamento"
};

// ================================
// BANIR (PRINCIPAL)
// ================================
export async function banirCategoria(msg, sock, from, args) {
  try {
    if (!msg.key.remoteJid.includes("@g.us")) {
      return { texto: "❌ Apenas em grupo." };
    }

    const tipoInput = args?.[0]?.toLowerCase?.().trim?.();
    const categoria = CATEGORIAS[tipoInput];

    if (!categoria) {
      return {
        texto: `❌ Use:

!banir golpista
!banir nao-paga
!banir ref-falsa
!banir comportamento`
      };
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

      const lista = db[grupo][id][categoria];

      lista.push({
        motivo: args.slice(1).join(" ") || "Sem descrição",
        data: Date.now()
      });

      db[grupo][id][categoria] = limpar(lista);

      total++;
    }

    saveDB(db);

    return {
      texto: `🚫 ${total} marcado(s) como ${tipoInput}`
    };

  } catch (err) {
    console.log("ERRO BANIR:", err);
    return { texto: "❌ Erro." };
  }
}

// ================================
// STATUS
// ================================
function calcularStatus(d) {
  const g = d.golpista.length;
  const l = d.nao_pagou_leilao.length;
  const r = d.referencias_falsas.length;
  const c = d.comportamento.length;

  const score = -(g * 5 + l * 3 + r * 4 + c);

  let nivel = "NEUTRO";
  if (g > 0) nivel = "GOLPISTA 🚨";
  else if (score <= -5) nivel = "ALTO RISCO ⚠️";
  else if (score < 0) nivel = "RISCO";

  return { g, l, r, c, score, nivel };
}

// ================================
// DADOS
// ================================
export async function dados(msg, sock, from, args) {
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

    const s = calcularStatus(dados);

    return {
      texto: `📊 Histórico

🚨 Golpista: ${s.g}
💸 Não pagou: ${s.l}
❌ Ref falsa: ${s.r}
⚠️ Comportamento: ${s.c}

Score: ${s.score}
Status: ${s.nivel}`
    };

  } catch (err) {
    console.log("ERRO DADOS:", err);
    return { texto: "❌ Erro." };
  }
}

// ================================
// FIM
// ================================