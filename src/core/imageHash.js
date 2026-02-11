// INÍCIO imageHash.js
import fs from "fs";
import path from "path";
import crypto from "crypto";

const imgPath = path.join("src", "data", "imagens.json");

// garante que o arquivo existe
function loadDB() {
  if (!fs.existsSync(imgPath)) {
    fs.writeFileSync(imgPath, "{}");
  }
  return JSON.parse(fs.readFileSync(imgPath, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(imgPath, JSON.stringify(db, null, 2));
}

// gera hash SHA256 do buffer da imagem
export function gerarHashImagem(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// salva hash no json
export function registrarImagem(grupoId, hash) {
  const db = loadDB();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!db[grupoId]) db[grupoId] = {};
  if (!db[grupoId][hoje]) db[grupoId][hoje] = [];

  db[grupoId][hoje].push(hash);

  saveDB(db);
}

// verifica se imagem já foi enviada no dia
export function imagemDuplicada(grupoId, hash) {
  const db = loadDB();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!db[grupoId] || !db[grupoId][hoje]) return false;

  return db[grupoId][hoje].includes(hash);
}
// FIM imageHash.js
