/* INÍCIO abrir-fechar.js */

import fs from "fs";
import path from "path";   // ✅ CORRIGIDO: necessário para path.resolve

const REM_PATH = path.resolve("src/data/reminders.json");

// INÍCIO carregar lembretes internos
function loadReminders() {
  if (!fs.existsSync(REM_PATH)) {
    fs.writeFileSync(REM_PATH, JSON.stringify({ lembretes: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(REM_PATH));
}
// FIM carregar lembretes internos

// INÍCIO salvar lembretes
function saveReminders(data) {
  fs.writeFileSync(REM_PATH, JSON.stringify(data, null, 2));
}
// FIM salvar lembretes internal

// INÍCIO montar data
function montarDataHoje(horaStr) {
  const [h, m] = horaStr.split(":");
  const agora = new Date();
  agora.setHours(Number(h), Number(m), 0, 0);
  return agora.toISOString();
}
// FIM montar data


// ======================================================
// /abrir
// ======================================================
export async function comandoAbrir(msg, sock, args) {
  const jid = msg.key.remoteJid;

  // 🔥 Detecta execução via SCHEDULER
  const isScheduler = !msg.message || Object.keys(msg.message).length === 0;

  // ✔ Execução imediata → AGORA
  if (isScheduler || args.length === 0) {
    await sock.groupSettingUpdate(jid, "not_announcement");
    return {
      tipo: "abrir",
      mensagem: "🔓 Grupo aberto! Agora todo mundo pode falar."
    };
  }

  // ✔ Execução AGENDADA → horário definido
  const hora = args[0];

  if (!hora.includes(":")) {
    return {
      tipo: "abrir",
      mensagem: "❌ Formato inválido. Use: /abrir HH:MM"
    };
  }

  const db = loadReminders();
  const id = (db.lembretes.at(-1)?.id || 0) + 1;

  db.lembretes.push({
    id,
    grupo: jid,
    tipoEspecial: "abrir_grupo",
    quando: montarDataHoje(hora),
    texto: `Abrir grupo às ${hora}`,
    repeat: "daily"
  });

  saveReminders(db);

  return {
    tipo: "abrir",
    mensagem: `🔓 Agendado! Vou abrir o grupo todo dia às ${hora}.`
  };
}


// ======================================================
// /fechar
// ======================================================
export async function comandoFechar(msg, sock, args) {
  const jid = msg.key.remoteJid;

  // 🔥 Detecta execução via SCHEDULER
  const isScheduler = !msg.message || Object.keys(msg.message).length === 0;

  // ✔ Execução imediata → AGORA
  if (isScheduler || args.length === 0) {
    await sock.groupSettingUpdate(jid, "announcement");
    return {
      tipo: "fechar",
      mensagem: "🔒 Grupo fechado! Só admins falam agora."
    };
  }

  // ✔ Execução AGENDADA
  const hora = args[0];

  if (!hora.includes(":")) {
    return {
      tipo: "fechar",
      mensagem: "❌ Formato inválido. Use: /fechar HH:MM"
    };
  }

  const db = loadReminders();
  const id = (db.lembretes.at(-1)?.id || 0) + 1;

  db.lembretes.push({
    id,
    grupo: jid,
    tipoEspecial: "fechar_grupo",
    quando: montarDataHoje(hora),
    texto: `Fechar grupo às ${hora}`,
    repeat: "daily"
  });

  saveReminders(db);

  return {
    tipo: "fechar",
    mensagem: `🔒 Agendado! Vou fechar o grupo todo dia às ${hora}.`
  };
}

/* FIM abrir-fechar.js */
