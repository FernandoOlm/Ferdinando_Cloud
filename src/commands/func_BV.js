// --------------------------------------------------------
// FUNC_BV.JS — ENGINE + COMANDOS BV
// --------------------------------------------------------

import fs from "fs";
import path from "path";

// Caminho do arquivo BV
const filePath = path.resolve("src/data/bv.json");

// Garantir arquivo BV existe
function loadBVFile() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2), "utf8");
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Salvar BV
function saveBVFile(json) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
}

// --------------------------------------------------------
// ENGINE BV
// --------------------------------------------------------

export function engineCriarBV(jid, mensagem) {
  const data = loadBVFile();
  data[jid] = {
    ativo: true,
    mensagem
  };
  saveBVFile(data);

  return {
    status: "ok",
    tipo: "criar",
    mensagem
  };
}

export function engineAtivarBV(jid) {
  const data = loadBVFile();

  if (!data[jid]) {
    data[jid] = { ativo: true, mensagem: "" };
  } else {
    data[jid].ativo = true;
  }

  saveBVFile(data);
  return { status: "ok", tipo: "ativar" };
}

export function engineDesativarBV(jid) {
  const data = loadBVFile();

  if (!data[jid]) {
    data[jid] = { ativo: false, mensagem: "" };
  } else {
    data[jid].ativo = false;
  }

  saveBVFile(data);
  return { status: "ok", tipo: "desativar" };
}

export function engineVerBV(jid) {
  const data = loadBVFile();
  const bv = data[jid] || { ativo: false, mensagem: "" };

  return {
    status: "ok",
    tipo: "ver",
    ativo: bv.ativo,
    mensagem: bv.mensagem || ""
  };
}

export function engineDeletarBV(jid) {
  const data = loadBVFile();
  delete data[jid];
  saveBVFile(data);

  return { status: "ok", tipo: "deletar" };
}

// --------------------------------------------------------
// COMANDOS BV — já usando os engines acima
// --------------------------------------------------------

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

// --------------------------------------------------------
// FIM DO ARQUIVO
// --------------------------------------------------------
