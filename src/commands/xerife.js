// INÍCIO xerife.js
import fs from "fs";
import path from "path";

const xerifePath = path.join("src", "data", "xerife.json");

function loadXerife() {
  if (!fs.existsSync(xerifePath)) {
    fs.writeFileSync(xerifePath, JSON.stringify({ grupos: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(xerifePath, "utf8"));
}

function saveXerife(db) {
  fs.writeFileSync(xerifePath, JSON.stringify(db, null, 2));
}

export function ativarXerife(grupoId) {
  const db = loadXerife();
  db.grupos[grupoId] = {
    ativo: true,
    atualizado: new Date().toISOString(),
  };
  saveXerife(db);

  // 🔥 RESPOSTA PARA O DISPATCHER
  return {
    status: "ok",
    mensagem: "🔫 *Xerife ativado!* Agora eu tô de olho nessa bagunça."
  };
}

export function desativarXerife(grupoId) {
  const db = loadXerife();

  if (!db.grupos[grupoId] || db.grupos[grupoId].ativo === false) {
    return {
      status: "ok",
      mensagem: "🛑 O xerife já estava desligado."
    };
  }

  db.grupos[grupoId].ativo = false;
  saveXerife(db);

  // 🔥 RESPOSTA PARA O DISPATCHER
  return {
    status: "ok",
    mensagem: "🛑 *Xerife desativado!* Vou dar um descanso."
  };
}

export function xerifeAtivo(grupoId) {
  const db = loadXerife();
  return db.grupos[grupoId]?.ativo === true;
}

// FIM xerife.js
