// INÍCIO autorizar.js — comando !autorizar

import { autorizarUsuario } from "./auth.js";

export async function comandoAutorizar(msg, sock) {
  const rootId =
    (msg.key.participant || msg.key.remoteJid || "").replace(/@.*/, "");

  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const resultado = autorizarUsuario(rootId, msg, texto);

  return {
    tipo: "autorizar",
    ...resultado
  };
}

// FIM autorizar.js
