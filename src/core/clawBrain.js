// INÍCIO clawBrain.js — IA + Sistema Profissional

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
  if (!jid || jid.endsWith("@g.us")) return null;

  const raw = msgObj?.key?.participant || jid;
  const fromClean = raw.replace(/@.*/, "");

  const texto =
    msgObj?.message?.conversation ||
    msgObj?.message?.extendedTextMessage?.text ||
    "";

  const textoLower = texto.toLowerCase();

  const bansPath = path.resolve("src/data/bans.json");

  if (fs.existsSync(bansPath)) {
    const bansDB = JSON.parse(fs.readFileSync(bansPath, "utf8"));
    const banGlobal = bansDB.global?.find(b => b.alvo === fromClean);

    if (banGlobal) {
      return "Seu acesso foi bloqueado. Contate a administração.";
    }
  }

  if (textoLower.includes("sou de menor")) {
    return "Protocolo de segurança ativado.";
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
  if (!jid || !texto) return "";

  if (texto.toLowerCase().includes("amigo")) {
    setFriend(jid);
    return "Registro confirmado.";
  }

  const acao = await executarAcoesAutomaticas_Unique01(texto, jid);
  if (acao) return compactarResposta_Unique01(acao);

  const r = await aiGenerateReply_Unique01(texto);
  return compactarResposta_Unique01(r);
}

// ------------------ CENTRAL ------------------
export async function clawBrainProcess_Unique01(msgObj) {

  // 🔥 1️⃣ Sistema PV tem prioridade
  const sistemaPV = await verificarSistemaPV(msgObj);
  if (sistemaPV) return sistemaPV;

  // 🔥 2️⃣ COMANDOS NÃO PASSAM PELA IA
  if (msgObj?.tipo === "comando" && msgObj?.comando) {

    const dados = msgObj?.dados || {};

    // Caso comando já tenha formatado resposta estruturada
    if (typeof dados === "string") return dados;

    if (dados?.mensagem) return dados.mensagem;
    if (dados?.texto) return dados.texto;
    if (dados?.anuncioIA) return dados.anuncioIA;
    if (dados?.despedida) return dados.despedida;

    if (dados?.motivo) return "Operação não permitida.";

    return "Comando executado.";
  }

  // 🔥 3️⃣ Conversa normal
  return await processarIANormal(msgObj);
}

// FIM clawBrain.js
