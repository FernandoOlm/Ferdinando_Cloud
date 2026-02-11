// INÍCIO xerifeStrikes.js
import fs from "fs";
import path from "path";

const strikesPath = path.join("src", "data", "xerifeStrikes.json");

// garante o arquivo
function loadDB() {
  if (!fs.existsSync(strikesPath)) {
    fs.writeFileSync(strikesPath, JSON.stringify({ grupos: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(strikesPath, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(strikesPath, JSON.stringify(db, null, 2));
}

// incrementa strikes
export function addStrike(grupoId, userId) {
  const db = loadDB();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!db.grupos[grupoId]) db.grupos[grupoId] = {};
  if (!db.grupos[grupoId][hoje]) db.grupos[grupoId][hoje] = {};

  if (!db.grupos[grupoId][hoje][userId]) db.grupos[grupoId][hoje][userId] = 0;

  db.grupos[grupoId][hoje][userId]++;

  saveDB(db);

  return db.grupos[grupoId][hoje][userId];
}

export function getStrikes(grupoId, userId) {
  const db = loadDB();
  const hoje = new Date().toISOString().slice(0, 10);

  return db.grupos?.[grupoId]?.[hoje]?.[userId] ?? 0;
}
// FIM xerifeStrikes.js
