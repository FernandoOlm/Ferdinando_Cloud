// INÍCIO cadastroAll.js — /cadastro-all

import fs from "fs";
import path from "path";

const AUTH_PATH = path.resolve("src/data/auth/allowed.json");

function loadJSON() {
  return JSON.parse(fs.readFileSync(AUTH_PATH));
}

function saveJSON(data) {
  fs.writeFileSync(AUTH_PATH, JSON.stringify(data, null, 2));
}

export async function comandoCadastroAll(msg, fromClean, textoOriginal) {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return { status: "erro", tipo: "cadastro-all", motivo: "nao_grupo" };
  }

  const db = loadJSON();

  if (!db.grupos[jid]) {
    return { status: "erro", tipo: "cadastro-all", motivo: "grupo_sem_autorizacao" };
  }

  const grupo = db.grupos[jid];

  if (!grupo.autorizados.includes(fromClean)) {
    return { status: "erro", tipo: "cadastro-all", motivo: "nao_autorizado" };
  }

  if (!textoOriginal || textoOriginal.trim().length === 0) {
    return { status: "erro", tipo: "cadastro-all", motivo: "mensagem_vazia" };
  }

  grupo.mensagemAll = textoOriginal.trim();
  saveJSON(db);

  return {
    status: "ok",
    tipo: "cadastro-all",
    mensagem: grupo.mensagemAll,
  };
}

// FIM cadastroAll.js
