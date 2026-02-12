// INÍCIO xerife.js
import fs from "fs";
import path from "path";

// Caminho absoluto seguro
const xerifePath = path.resolve("src/data/xerife.json");

// -----------------------------
// GARANTE ARQUIVO
// -----------------------------
function loadXerife() {
  if (!fs.existsSync(xerifePath)) {
    fs.writeFileSync(xerifePath, JSON.stringify({ grupos: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(xerifePath, "utf8"));
}

function saveXerife(db) {
  fs.writeFileSync(xerifePath, JSON.stringify(db, null, 2));
}

// -----------------------------
// EXTRAI JID DO MSG
// -----------------------------
function extrairGrupoId(msg) {
  return msg?.key?.remoteJid;
}

// -----------------------------
// ATIVAR
// -----------------------------
export function ativarXerife(msg) {
  const grupoId = extrairGrupoId(msg);
  if (!grupoId || !grupoId.endsWith("@g.us")) {
    return {
      status: "erro",
      mensagem: "Comando só pode ser usado em grupo."
    };
  }

  const db = loadXerife();

  db.grupos[grupoId] = {
    ativo: true,
    atualizado: new Date().toISOString(),
  };

  saveXerife(db);

  console.log("🔫 Xerife ativado para:", grupoId);

  return {
    status: "ok",
    mensagem: "🔫 *Xerife ativado!*"
  };
}

// -----------------------------
// DESATIVAR
// -----------------------------
export function desativarXerife(msg) {
  const grupoId = extrairGrupoId(msg);
  if (!grupoId || !grupoId.endsWith("@g.us")) {
    return {
      status: "erro",
      mensagem: "Comando só pode ser usado em grupo."
    };
  }

  const db = loadXerife();

  if (!db.grupos[grupoId]) {
    return {
      status: "ok",
      mensagem: "🛑 Xerife já estava desligado."
    };
  }

  db.grupos[grupoId].ativo = false;

  saveXerife(db);

  console.log("🛑 Xerife desativado para:", grupoId);

  return {
    status: "ok",
    mensagem: "🛑 *Xerife desativado!*"
  };
}

// -----------------------------
// VERIFICAR SE ATIVO
// -----------------------------
export function xerifeAtivo(grupoId) {
  const db = loadXerife();
  const ativo = db.grupos[grupoId]?.ativo === true;

  console.log("🔎 Checando xerife:", grupoId, "→", ativo);

  return ativo;
}

// FIM xerife.js
