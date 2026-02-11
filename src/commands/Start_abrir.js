/* ===============================
   Start_abrir.js (100% CORRIGIDO)
   =============================== */

import fs from "fs";
import path from "path";   // ✅ ESSENCIAL
import { comandoAbrir } from "./abrir-fechar.js";

const SCHEDULE_PATH = path.resolve("src/data/schedule_action.json");

function salvarScheduleAction(grupo, data, hora, file, fn, comando) {
  if (!fs.existsSync(SCHEDULE_PATH)) {
    fs.writeFileSync(SCHEDULE_PATH, JSON.stringify({}, null, 2));
  }

  const json = JSON.parse(fs.readFileSync(SCHEDULE_PATH, "utf8"));

  json.acao = {
    grupo,
    data,
    hora,
    comando,
    aconteceu: false,
    file,
    function: fn
  };

  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(json, null, 2));
}

export async function Start_Abrir(msg, sock) {

  const isScheduler = !msg.message || Object.keys(msg.message).length === 0;

  let args = [];

  if (!isScheduler) {
    const txt =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    args = txt
      .replace("!abrir", "")
      .trim()
      .split(" ")
      .filter(x => x);
  }

  if (isScheduler || args.length === 0) {
    const result = await comandoAbrir(msg, sock, []);
    return {
      tipo: "abrir",
      ...result
    };
  }

  // Data padrão BR
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const data = `${ano}-${mes}-${dia}`;

  const horaInformada = args[0];

  salvarScheduleAction(
    msg.key.remoteJid,
    data,
    horaInformada,
    "../commands/Start_abrir.js",
    "Start_Abrir",
    "!abrir"
  );

  return {
    tipo: "abrir",
    mensagem: `⏰ Ação de ABRIR agendada para ${horaInformada}`
  };
}
