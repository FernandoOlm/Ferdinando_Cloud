// INÍCIO bv.js — comandos BV (JSON dispatcher)

import {
  engineCriarBV,
  engineAtivarBV,
  engineDesativarBV,
  engineVerBV,
  engineDeletarBV
} from "./func_BV.js";

// !criar-bv
export async function comandoCriarBV(msg, sock) {
  const jid = msg.key.remoteJid;

  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const textoBV = txt.replace("!criar-bv", "").trim();
  const resultado = engineCriarBV(jid, textoBV);

  return {
    tipo: "criar_bv",
    ...resultado
  };
}

// !ativar-bv
export async function comandoAtivarBV(msg, sock) {
  const jid = msg.key.remoteJid;
  const resultado = engineAtivarBV(jid);

  return {
    tipo: "ativar_bv",
    ...resultado
  };
}

// !desativar-bv
export async function comandoDesativarBV(msg, sock) {
  const jid = msg.key.remoteJid;
  const resultado = engineDesativarBV(jid);

  return {
    tipo: "desativar_bv",
    ...resultado
  };
}

// !ver-bv
export async function comandoVerBV(msg, sock) {
  const jid = msg.key.remoteJid;
  const resultado = engineVerBV(jid);

  return {
    tipo: "ver_bv",
    ...resultado
  };
}

// !del-bv
export async function comandoDelBV(msg, sock) {
  const jid = msg.key.remoteJid;
  const resultado = engineDeletarBV(jid);

  return {
    tipo: "del_bv",
    ...resultado
  };
}

// FIM bv.js
