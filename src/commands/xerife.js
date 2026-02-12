// INÍCIO xerife.js
import fs from "fs";
import path from "path";

const xerifePath = path.resolve("src/data/xerife.json");

function loadXerife() {
  console.log("📂 XERIFE PATH:", xerifePath);

  if (!fs.existsSync(xerifePath)) {
    console.log("⚠️ xerife.json não existe. Criando...");
    fs.writeFileSync(xerifePath, JSON.stringify({ grupos: {} }, null, 2));
  }

  const raw = fs.readFileSync(xerifePath, "utf8");
  console.log("📦 Conteúdo xerife.json:", raw);

  return JSON.parse(raw);
}

function saveXerife(db) {
  fs.writeFileSync(xerifePath, JSON.stringify(db, null, 2));
  console.log("💾 Xerife salvo:", db);
}

export function ativarXerife(grupoId) {
  console.log("🔫 Ativando xerife para:", grupoId);

  const db = loadXerife();

  db.grupos[grupoId] = {
    ativo: true,
    atualizado: new Date().toISOString(),
  };

  saveXerife(db);

  return {
    status: "ok",
    mensagem: "🔫 *Xerife ativado!*"
  };
}

export function xerifeAtivo(grupoId) {
  const db = loadXerife();

  console.log("🔎 Verificando xerife para grupo:", grupoId);
  console.log("📊 DB atual:", db.grupos);

  const ativo = db.grupos[grupoId]?.ativo === true;

  console.log("✅ Xerife ativo?", ativo);

  return ativo;
}
// FIM xerife.js
