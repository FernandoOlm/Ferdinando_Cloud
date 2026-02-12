// INÍCIO clawBrain.js — IA Pura + Sistema PV

import fs from "fs";
import path from "path";
import { aiGenerateReply_Unique01 } from "./aiClient.js";
import { executarAcoesAutomaticas_Unique01 } from "../actions/index.js";
import { isFriend, setFriend } from "./friendManager.js";

// ------------------ UTIL ------------------
function compactarResposta_Unique01(t) {
  if (!t) return "";
  return t
    .replace(/@\d+/g, "")
    .replace(/<@\d+>/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------ SISTEMA PV ------------------
async function verificarSistemaPV(msgObj) {

  const jid = msgObj?.key?.remoteJid;
  if (!jid || jid.endsWith("@g.us")) return null; // só PV

  const raw = msgObj?.key?.participant || jid;
  const fromClean = raw.replace(/@.*/, "");

  const texto =
    msgObj?.message?.conversation ||
    msgObj?.message?.extendedTextMessage?.text ||
    "";

  const textoLower = texto.toLowerCase();

  // --------- BAN GLOBAL ---------
  const bansPath = path.resolve("src/data/bans.json");
  if (fs.existsSync(bansPath)) {
    const bansDB = JSON.parse(fs.readFileSync(bansPath, "utf8"));
    const banGlobal = bansDB.global?.find(b => b.alvo === fromClean);

    if (banGlobal) {
      const resposta = await aiGenerateReply_Unique01(`
Responda como sistema automatizado institucional.
Deixe claro que é uma Inteligência Artificial.
Informe que o acesso foi bloqueado automaticamente.
Motivo: ${banGlobal.motivo}.
Não demonstre emoção.
Finalize dizendo que o atendimento automático continua.
      `);

      return compactarResposta_Unique01(resposta);
    }
  }

  // --------- PALAVRA SENSÍVEL ---------
  if (textoLower.includes("sou de menor")) {

    const resposta = await aiGenerateReply_Unique01(`
Responda como sistema automatizado.
Informe que uma palavra sensível foi detectada.
Explique que o protocolo de segurança foi ativado automaticamente.
Deixe claro que é uma Inteligência Artificial.
Não demonstre julgamento.
Finalize dizendo que o atendimento automático continua.
    `);

    return compactarResposta_Unique01(resposta);
  }

  return null;
}

// ------------------ IA NORMAL ------------------
async function processarIANormal(msgObj) {

  const texto =
    msgObj?.message?.conversation ||
    msgObj?.message?.extendedTextMessage?.text ||
    "";

  const jid = msgObj?.key?.remoteJid;
  if (!jid) return "";

  if (texto.toLowerCase().includes("amigo")) {
    setFriend(jid);
    const r = await aiGenerateReply_Unique01(
      "Responda em 1 linha confirmando amizade."
    );
    return compactarResposta_Unique01(r);
  }

  const acao = await executarAcoesAutomaticas_Unique01(texto, jid);
  if (acao) return compactarResposta_Unique01(acao);

  const r = await aiGenerateReply_Unique01(texto);
  return compactarResposta_Unique01(r);
}

// ------------------ CENTRAL ------------------
export async function clawBrainProcess_Unique01(msgObj) {

  // 🔥 SISTEMA PV PRIORIDADE ABSOLUTA
  const sistemaPV = await verificarSistemaPV(msgObj);

  if (sistemaPV) {
    return sistemaPV; // ← SAI AQUI E NÃO CONTINUA
  }

  // 🔥 SE NÃO FOR SISTEMA, SEGUE NORMAL

  if (msgObj?.tipo === "comando" && msgObj?.comando) {
    const r = await aiGenerateReply_Unique01(
      `Comando "${msgObj.comando}". Dados: ${JSON.stringify(msgObj.dados)}`
    );
    return compactarResposta_Unique01(r);
  }

  return await processarIANormal(msgObj);
}
