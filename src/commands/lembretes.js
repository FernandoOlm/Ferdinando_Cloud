/* ===============================
   SISTEMA DE LEMBRETES — AJUSTADO
   =============================== */

import fs from "fs";
import path from "path";  // ✅ IMPORT NECESSÁRIO

// =======================================
// PATH DO reminders.json
// =======================================
const REMINDERS_PATH = path.resolve("src/data/reminders.json");

// =======================================
// GARANTE ARQUIVO EXISTE
// =======================================
function ensure() {
  if (!fs.existsSync(REMINDERS_PATH)) {
    fs.writeFileSync(
      REMINDERS_PATH,
      JSON.stringify({ lembretes: [] }, null, 2)
    );
  }
}

// =======================================
// LOAD / SAVE / NEXT ID
// =======================================
function loadReminders() {
  ensure();
  return JSON.parse(fs.readFileSync(REMINDERS_PATH, "utf-8"));
}

function saveReminders(db) {
  fs.writeFileSync(REMINDERS_PATH, JSON.stringify(db, null, 2));
}

function nextId(db) {
  if (db.lembretes.length === 0) return 1;
  return Math.max(...db.lembretes.map(l => l.id)) + 1;
}

// =======================================================
// COMANDO PRINCIPAL — INTERPRETA !lembrete
// =======================================================
export async function comandoLembrete(msg, fromClean, textoOriginal) {
  const jid = msg.key.remoteJid;

  if (!jid.endsWith("@g.us")) {
    return { resposta: "Esse comando só funciona em grupos." };
  }

  const p = textoOriginal.trim().split(" ");

  if (p.length < 3) {
    return {
      resposta:
"Formato inválido.\nUse:\n!lembrete DD/MM/AAAA HH:MM [D|S|M] Mensagem"
    };
  }

  const dataStr = p[0];
  const horaStr = p[1];

  // Identifica repetição
  let repeat = null;
  let mensagem = "";

  if (["D", "S", "M"].includes(p[2].toUpperCase())) {
    const tipo = p[2].toUpperCase();
    repeat =
      tipo === "D" ? "daily" :
      tipo === "S" ? "weekly" :
      "monthly";

    mensagem = p.slice(3).join(" ");
  } else {
    mensagem = p.slice(2).join(" ");
  }

  // Converte data
  const [dd, mm, aa] = dataStr.split("/");
  const [hh, min] = horaStr.split(":");
  const dt = new Date(`${aa}-${mm}-${dd}T${hh}:${min}:00`);

  if (isNaN(dt.getTime())) {
    return { resposta: "Data ou hora inválida." };
  }

  // Salva lembrete
  const db = loadReminders();
  const id = nextId(db);

  db.lembretes.push({
    id,
    grupo: jid,
    autor: fromClean,
    quando: dt.toISOString(),
    texto: mensagem,
    repeat
  });

  saveReminders(db);

  // ----------------------------
  // Texto da repetição
  // ----------------------------
  const repTxt =
    repeat === "daily"   ? "Diário" :
    repeat === "weekly"  ? "Semanal" :
    repeat === "monthly" ? "Mensal" :
    "Único";

  // ----------------------------
  // Resumo inteligente
  // ----------------------------
  let resumo = "";

  if (repeat === "daily") {
    resumo = `🔁 Esse lembrete será enviado *todo dia às ${horaStr}*.`;
  }
  else if (repeat === "weekly") {
    const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const diaSemana = dias[new Date(`${aa}-${mm}-${dd}`).getDay()];
    resumo = `🔁 Esse lembrete será enviado *toda semana na ${diaSemana} às ${horaStr}*.`;
  }
  else if (repeat === "monthly") {
    resumo = `🔁 Esse lembrete será enviado *todo mês no dia ${dd} às ${horaStr}*.`;
  }
  else {
    resumo = `📌 Esse lembrete será enviado *uma única vez* na data informada.`;
  }

  // ----------------------------
  // Resposta final
  // ----------------------------
  return {
    resposta:
`✅ *Lembrete criado!* 

📅 *Data:* ${dataStr}
⏰ *Hora:* ${horaStr}
🔁 *Repetição:* ${repTxt}

📝 *Mensagem:* ${mensagem}

${resumo}`
  };
}

// =======================================================
// ROTA PRINCIPAL DO BOT → !lembrete
// =======================================================
export async function cmdLembrete(msg, sock) {
  const fromClean =
    (msg.key.participant || msg.key.remoteJid || "").split("@")[0];

  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const textoOriginal = txt.replace("!lembrete", "").trim();

  return await comandoLembrete(msg, fromClean, textoOriginal);
}

// =======================================================
// COMPATIBILIDADE LEGADA — !lembrete-diario / semanal / mensal
// =======================================================

export async function cmdLembreteDiario(msg, sock) {
  const fromClean =
    (msg.key.participant || msg.key.remoteJid || "").split("@")[0];
  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";
  const original = txt.replace("!lembrete-diario", "").trim();
  return await comandoLembrete(msg, fromClean, "D " + original);
}

export async function cmdLembreteSemanal(msg, sock) {
  const fromClean =
    (msg.key.participant || msg.key.remoteJid || "").split("@")[0];
  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";
  const original = txt.replace("!lembrete-semanal", "").trim();
  return await comandoLembrete(msg, fromClean, "S " + original);
}

export async function cmdLembreteMensal(msg, sock) {
  const fromClean =
    (msg.key.participant || msg.key.remoteJid || "").split("@")[0];
  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";
  const original = txt.replace("!lembrete-mensal", "").trim();
  return await comandoLembrete(msg, fromClean, "M " + original);
}

// =======================================================
// COMANDO !desativar-lembrete
// =======================================================
export async function cmdDesativarLembrete(msg, sock) {
  const fromClean =
    (msg.key.participant || msg.key.remoteJid || "").split("@")[0];
  const txt =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const clean = txt.replace("!desativar-lembrete", "").trim();
  const args = clean.split(" ").filter(x => x.length > 0);

  const db = loadReminders();

  if (args.length === 0) {
    return {
      resposta:
`📋 *Lembretes cadastrados:* 

${db.lembretes
  .map(l => `• ID ${l.id} — ${l.texto} (${l.repeat || "único"})`)
  .join("\n")}`
    };
  }

  const id = Number(args[0]);
  if (isNaN(id)) {
    return { resposta: "ID inválido." };
  }

  const antes = db.lembretes.length;
  db.lembretes = db.lembretes.filter(l => l.id !== id);
  saveReminders(db);

  if (db.lembretes.length === antes) {
    return { resposta: "Nenhum lembrete encontrado com esse ID." };
  }

  return { resposta: `🗑️ Lembrete ID *${id}* removido.` };
}
