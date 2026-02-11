/* INÍCIO all.js — /all 100% corrigido */

import fs from "fs";
import path from "path";   // ✅ CORRIGIDO: faltava esse import para path.resolve

const AUTH_PATH = path.resolve("src/data/auth/allowed.json");

// =============================================================
// 🔧 NORMALIZADOR DE ID
// =============================================================
function normalizarUserIdFerdinando(raw) {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 15) digits = digits.slice(-15);
  return digits;
}

// =============================================================
// 📦 Carregar JSON de permissões
// =============================================================
function loadJSON() {
  return JSON.parse(fs.readFileSync(AUTH_PATH));
}

// =============================================================
// 🚨 COMANDO /all
// =============================================================
export async function comandoAll(msg, sock, fromClean, textoOriginal) {
  const jid = msg.key.remoteJid;

  // Validar se é grupo
  if (!jid.endsWith("@g.us")) {
    return { status: "erro", tipo: "all", motivo: "nao_grupo" };
  }

  // Carregar banco
  const db = loadJSON();

  if (!db.grupos[jid]) {
    return { status: "erro", tipo: "all", motivo: "grupo_sem_autorizacao" };
  }

  const grupo = db.grupos[jid];

  // Normalizar ID do admin
  const fromCleanNormalizado = normalizarUserIdFerdinando(fromClean);

  // DEBUG
  //console.log("====== DEBUG /all ======");
  //console.log("JID:", jid);
  //console.log("fromClean RAW:", fromClean);
  //console.log("fromClean NORMALIZADO:", fromCleanNormalizado);
  //console.log("Autorizados:", grupo.autorizados);
  //console.log(
  //  "Autorizado?:",
  //  grupo.autorizados.includes(fromCleanNormalizado)
  //);
  //console.log("========================");

  // Validar autorização
  if (!grupo.autorizados.includes(fromCleanNormalizado)) {
    return { status: "erro", tipo: "all", motivo: "nao_autorizado" };
  }

  // Buscar membros do grupo
  const meta = await sock.groupMetadata(jid);
  const ids = meta.participants.map((p) => p.id);

  // Primeiro disparo (ping)
  await sock.sendMessage(jid, {
    text: "🔔",
    mentions: ids,
  });

  // Tratar mensagem
  let textoOriginalStr = "";
  if (Array.isArray(textoOriginal)) {
    textoOriginalStr = textoOriginal.join(" ").trim();
  } else if (typeof textoOriginal === "string") {
    textoOriginalStr = textoOriginal.trim();
  }

  const mensagemFinal =
    textoOriginalStr.length > 0
      ? textoOriginalStr
      : grupo.mensagemAll || "🔔 Atenção! Mensagem geral enviada!";

  await sock.sendMessage(jid, {
    text: mensagemFinal,
    mentions: ids,
  });

  return {
    status: "ok",
    tipo: "all",
    nomeGrupo: grupo.nome,
    totalMembros: ids.length,
    textoOriginal,
    mensagemUsada: mensagemFinal,
  };
}

/* FIM all.js */
