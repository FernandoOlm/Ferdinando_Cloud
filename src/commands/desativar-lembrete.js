// INÍCIO desativar-lembrete.js — ENGINE CORRIGIDO

import fs from "fs";
import path from "path";

// Caminho correto e universal para reminders.json
const REM_PATH = path.join(process.cwd(), "src", "data", "reminders.json");

function loadReminders() {
  if (!fs.existsSync(REM_PATH)) {
    fs.writeFileSync(REM_PATH, JSON.stringify({ lembretes: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(REM_PATH));
}

function saveReminders(data) {
  fs.writeFileSync(REM_PATH, JSON.stringify(data, null, 2));
}

export async function comandoDesativarLembrete(msg, fromClean, args) {
  const jid = msg.key.remoteJid;
  const db = loadReminders();

  // LISTAR TODOS
  if (args[0] === "listar") {
    const lista = db.lembretes
      .filter(l => l.grupo === jid)
      .map(l => `${l.id} - (${l.repeat || "único"}) ${l.texto}`);

    return {
      status: "ok",
      tipo: "listar",
      lembretes: lista
    };
  }

  // DESATIVAR POR ID
  const id = Number(args[0]);

  if (isNaN(id)) {
    return {
      status: "erro",
      tipo: "id_invalido"
    };
  }

  const index = db.lembretes.findIndex(l => l.id === id && l.grupo === jid);

  if (index === -1) {
    return {
      status: "erro",
      tipo: "id_nao_encontrado"
    };
  }

  const removido = db.lembretes.splice(index, 1)[0];
  saveReminders(db);

  return {
    status: "ok",
    tipo: "desativado",
    id,
    mensagem: removido.texto
  };
}

// FIM do engine corrigido
