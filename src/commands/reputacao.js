// ================================
// INÍCIO - reputacao.js LGPD SAFE FINAL
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
// HASH POR GRUPO
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
function limpar(lista) {
  const agora = Date.now();
  return lista.filter(r => agora - r.data < LIMITE_DIAS * 86400000);
}

// ================================
// EXTRATOR UNIVERSAL
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
// CATEGORIAS
// ================================
const CATEGORIAS = {
  golpista: "golpista",
  "nao-paga": "nao_pagou_leilao",
  "ref-falsa": "referencias_falsas",
  comportamento: "comportamento"
};

// ================================
// GARANTE ESTRUTURA DO USUÁRIO
// ================================
function criarBase() {
  return {
    golpista: [],
    nao_pagou_leilao: [],
    referencias_falsas: [],
    comportamento: []
  };
}

// ================================
// COMANDO PRINCIPAL - BANIR
// ================================
export async function banirCategoria(msg, sock, from, args) {
  try {
    if (!msg.key.remoteJid.includes("@g.us")) {
      return { texto: "❌ Comando apenas para grupos." };
    }

    if (!args || args.length === 0) {
      return {
        texto: `❌ Use: !banir [categoria]

Categorias:
- golpista
- nao-paga
- ref-falsa
- comportamento`
      };
    }

    const tipoInput = args[0].toLowerCase().trim();
    const categoria = CATEGORIAS[tipoInput];

    if (!categoria) {
      return {
        texto: `❌ Categoria inválida.

Use:
- golpista
- nao-paga
- ref-falsa
- comportamento`
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

      db[grupo][id][categoria].push({
        motivo: args.slice(1).join(" ") || "Sem descrição",
        data: Date.now()
      });

      db[grupo][id][categoria] = limpar(db[grupo][id][categoria]);

      total++;
    }

    saveDB(db);

    return {
      texto: `🚫 ${total} usuário(s) marcado(s) como *${tipoInput}*`
    };

  } catch (err) {
    console.error("ERRO BANIR:", err);
    return { texto: "❌ Erro ao executar comando." };
  }
}

// ================================
// STATUS
// ================================
function calcularStatus(dados) {
  const g = dados.golpista.length;
  const l = dados.nao_pagou_leilao.length;
  const r = dados.referencias_falsas.length;
  const c = dados.comportamento.length;

  const score = -(g * 5 + l * 3 + r * 4 + c);

  let nivel = "NEUTRO";

  if (g > 0) nivel = "GOLPISTA 🚨";
  else if (score <= -5) nivel = "ALTO RISCO ⚠️";
  else if (score < 0) nivel = "RISCO";

  return { g, l, r, c, score, nivel };
}

// ================================
// CONSULTA
// ================================
export async function dados(msg) {
  try {
    const numeros = extrairNumerosUniversal(msg);

    if (!numeros.length) {
      return { texto: "❌ Nenhum número encontrado." };
    }

    const db = loadDB();
    const grupo = msg.key.remoteJid;

    if (!db[grupo]) {
      return { texto: "Nenhum registro encontrado." };
    }

    const id = hashNumero(numeros[0], grupo);
    const dados = db[grupo][id];

    if (!dados) {
      return { texto: "Nenhum registro encontrado." };
    }

    const s = calcularStatus(dados);

    return {
      texto: `📊 Histórico no grupo

🚨 Golpista: ${s.g}
💸 Não pagou leilão: ${s.l}
❌ Referências falsas: ${s.r}
⚠️ Comportamento: ${s.c}

Score: ${s.score}
Status: ${s.nivel}

⚠️ Sistema interno do grupo`
    };

  } catch (err) {
    console.error("ERRO DADOS:", err);
    return { texto: "❌ Erro ao consultar." };
  }
}

// ================================
// FIM
// ================================