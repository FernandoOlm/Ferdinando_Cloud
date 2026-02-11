// INÍCIO clawBrain.js — IA Pura + Suporte JSON

import { aiGenerateReply_Unique01 } from "./aiClient.js";
import { executarAcoesAutomaticas_Unique01 } from "../actions/index.js";
import { isFriend, setFriend } from "./friendManager.js";

// Compactador — 1 linha + censura total
function compactarResposta_Unique01(t) {
  if (!t) return "";
  return t
    .replace(/@\d+/g, "")
    .replace(/<@\d+>/g, "")
    .replace(/\b(você|vc|cê|tu|teu|seu|sua|contigo)\b/gi, "")
    .replace(/\b(pessoa|usuário|remetente|autor)\b/gi, "")
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/gi, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------ SORTEIO ------------------
async function gerarDramaSorteio_Unique01() {
  const frase = await aiGenerateReply_Unique01(`
    Gere uma frase hype e curta para sorteio, máximo 5 palavras, sem mencionar pessoas.
  `);
  return compactarResposta_Unique01(frase);
}

async function fraseResultadoSorteio_Unique01(lista) {
  const frase = await aiGenerateReply_Unique01(`
    Frase final, 1 linha. Sem fantasia. Lista: ${JSON.stringify(lista)}
  `);
  return compactarResposta_Unique01(frase);
}

// ------------------ IA DE COMANDO ------------------
async function processarComandoIA(obj) {
  const { comando, dados } = obj;

  // Sem dados
  if (!dados) {
    const r = await aiGenerateReply_Unique01("Responda em 1 linha dizendo que o comando está vazio.");
    return compactarResposta_Unique01(r);
  }

  // SORTEIO
  if (dados.tipo === "sorteio") {
    const drama = await gerarDramaSorteio_Unique01();
    const final = await fraseResultadoSorteio_Unique01(dados.resultado);
    return `${drama} ${final}`;
  }

  // LISTAR MEMBROS
  if (dados.tipo === "listar_membros") {
    if (!Array.isArray(dados.membros) || dados.membros.length === 0)
      return "Nenhum membro encontrado.";

    return dados.membros
      .map((m, i) => `${i + 1} - ${m}`)
      .join("\n");
  }

  // Mensagem direta
  if (dados.mensagem) {
    return compactarResposta_Unique01(dados.mensagem);
  }

  // Ia limpa
  const r = await aiGenerateReply_Unique01(
    `Comando "${comando}". Responda em 1 linha. Dados: ${JSON.stringify(dados)}`
  );

  return compactarResposta_Unique01(r);
}

// ------------------ IA NORMAL ------------------
async function processarIANormal(msgObj) {
  const texto =
    msgObj?.message?.conversation ||
    msgObj?.message?.extendedTextMessage?.text ||
    "";

  const jid = msgObj?.key?.remoteJid;

  if (!jid) {
    // Mensagem fora de fluxo → ignorar
    return "";
  }

  if (texto.toLowerCase().includes("amigo")) {
    setFriend(jid);
    const r = await aiGenerateReply_Unique01("Responda em 1 linha confirmando amizade.");
    return compactarResposta_Unique01(r);
  }

  const acao = await executarAcoesAutomaticas_Unique01(texto, jid);
  if (acao) return compactarResposta_Unique01(acao);

  const r = await aiGenerateReply_Unique01(texto);
  return compactarResposta_Unique01(r);
}

// ------------------ CENTRAL ------------------
export async function clawBrainProcess_Unique01(msgObj) {

  // 🔥 RESPOSTA DE JSON (!comandos)
  if (msgObj?.tipo === "comando" && msgObj?.comando) {
    return await processarComandoIA(msgObj);
  }

  // boas-vindas
  if (msgObj?.tipo === "boasvindas") {
    const r = await aiGenerateReply_Unique01(
      `Melhore a mensagem para 1 linha, mantendo @. Texto: "${msgObj.mensagem}"`
    );
    return r.trim();
  }

  // IA NORMAL
  return await processarIANormal(msgObj);
}

// FIM clawBrain.js
