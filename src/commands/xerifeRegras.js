// INÍCIO xerifeRegras.js
import fs from "fs";
import path from "path";

import {
  gerarHashImagem,
  registrarImagem,
  imagemDuplicada
} from "../core/imageHash.js";

const linkPath = path.resolve("src/data/links.json");
const ANUNCIOS_DB = path.resolve("src/data/anuncios.json");

// ================= LINKS =================

function loadLinks() {
  console.log("📂 LINKS PATH:", linkPath);

  if (!fs.existsSync(linkPath)) {
    console.log("⚠️ links.json não existe. Criando...");
    fs.writeFileSync(linkPath, "{}");
  }

  const raw = fs.readFileSync(linkPath, "utf8");
  console.log("📦 Conteúdo links.json:", raw);

  return JSON.parse(raw);
}

function saveLinks(db) {
  fs.writeFileSync(linkPath, JSON.stringify(db, null, 2));
  console.log("💾 Links salvos:", db);
}

export function registrarLink(grupoId, url) {
  console.log("📝 Registrando link:", grupoId, url);

  const db = loadLinks();
  const hoje = new Date().toISOString().slice(0, 10);

  console.log("📅 Data usada:", hoje);

  if (!db[grupoId]) db[grupoId] = {};
  if (!db[grupoId][hoje]) db[grupoId][hoje] = [];

  db[grupoId][hoje].push(url);

  saveLinks(db);
}

export function linkDuplicado(grupoId, url) {
  console.log("🔍 Verificando duplicidade:", grupoId, url);

  const db = loadLinks();
  const hoje = new Date().toISOString().slice(0, 10);

  console.log("📅 Data usada:", hoje);

  if (!db[grupoId] || !db[grupoId][hoje]) {
    console.log("❌ Nenhum registro para hoje.");
    return false;
  }

  const duplicado = db[grupoId][hoje].includes(url);

  console.log("🚨 É duplicado?", duplicado);

  return duplicado;
}

export {
  gerarHashImagem,
  registrarImagem,
  imagemDuplicada
};
// FIM xerifeRegras.js
