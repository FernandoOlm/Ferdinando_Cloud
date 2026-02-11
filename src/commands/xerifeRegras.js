// INÍCIO xerifeRegras.js
import fs from "fs";
import path from "path";

// IMPORT CORRETO → VEM DE /src/core/
import {
  gerarHashImagem,
  registrarImagem,
  imagemDuplicada
} from "../core/imageHash.js";

// Caminho correto do arquivo de links
const linkPath = path.join("src", "data", "links.json");

// Caminho do arquivo de autorização de anúncios
const ANUNCIOS_DB = path.resolve("src/data/anuncios.json");

// ============================================================
// 🔥 FUNÇÃO NOVA — VERIFICAR SE USUÁRIO PODE ANUNCIAR
// ============================================================
export function usuarioPodeAnunciar(grupoId, userId) {
  try {
    if (!fs.existsSync(ANUNCIOS_DB)) return false;

    const raw = fs.readFileSync(ANUNCIOS_DB, "utf8");
    const db = JSON.parse(raw);

    const grupo = db.grupos?.[grupoId];
    if (!grupo) return false;

    return grupo.autorizados.includes(userId);
  } catch (e) {
    console.log("Erro ao validar autorização de anúncio:", e);
    return false;
  }
}

// ============================================================
// LINKS
// ============================================================
function loadLinks() {
  if (!fs.existsSync(linkPath)) {
    fs.writeFileSync(linkPath, "{}");
  }
  return JSON.parse(fs.readFileSync(linkPath, "utf8"));
}

function saveLinks(db) {
  fs.writeFileSync(linkPath, JSON.stringify(db, null, 2));
}

export function registrarLink(grupoId, url) {
  const db = loadLinks();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!db[grupoId]) db[grupoId] = {};
  if (!db[grupoId][hoje]) db[grupoId][hoje] = [];

  db[grupoId][hoje].push(url);
  saveLinks(db);
}

export function linkDuplicado(grupoId, url) {
  const db = loadLinks();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!db[grupoId] || !db[grupoId][hoje]) return false;

  return db[grupoId][hoje].includes(url);
}

// ============================================================
// EXPORTAR AS FUNÇÕES DE IMAGEM JÁ EXISTENTES (INALTERADAS)
// ============================================================
export {
  gerarHashImagem,
  registrarImagem,
  imagemDuplicada
};

// FIM xerifeRegras.js
