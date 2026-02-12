// INÍCIO xerifeStrikes.js
import fs from "fs";
import path from "path";

const strikesPath = path.resolve("src/data/xerifeStrikes.json");

function loadDB() {
  console.log("📂 STRIKES PATH:", strikesPath);

  if (!fs.existsSync(strikesPath)) {
    console.log("⚠️ xerifeStrikes.json não existe. Criando...");
    fs.writeFileSync(strikesPath, JSON.stringify({ grupos: {} }, null, 2));
  }

  const raw = fs.readFileSync(strikesPath, "utf8");
  console.log("📦 Conteúdo strikes:", raw);

  return JSON.parse(raw);
}

function saveDB(db) {
  fs.writeFileSync(strikesPath, JSON.stringify(db, null, 2));
  console.log("💾 Strikes salvos:", db);
}

export function addStrike(grupoId, userId) {
  console.log("➕ Adicionando strike:", grupoId, userId);

  const db = loadDB();
  const hoje = new Date().toISOString().slice(0, 10);

  console.log("📅 Data usada:", hoje);

  if (!db.grupos[grupoId]) db.grupos[grupoId] = {};
  if (!db.grupos[grupoId][hoje]) db.grupos[grupoId][hoje] = {};
  if (!db.grupos[grupoId][hoje][userId]) db.grupos[grupoId][hoje][userId] = 0;

  db.grupos[grupoId][hoje][userId]++;

  saveDB(db);

  console.log("🔥 Total strikes:", db.grupos[grupoId][hoje][userId]);

  return db.grupos[grupoId][hoje][userId];
}
// FIM xerifeStrikes.js
