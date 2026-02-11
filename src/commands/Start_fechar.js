/* ===============================
   Start_fechar.js (100% CORRIGIDO)
   =============================== */

import fs from "fs";
import path from "path";   // ✅ ESSENCIAL
import { comandoFechar } from "./abrir-fechar.js";

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

export async function Start_Fechar(msg, sock) {

  const isScheduler = !msg.message || Object.keys(msg.message).length === 0;

  let args = [];

  if (!isScheduler) {
    const txt =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";
      
    args = txt
      .replace("!fechar", "")
      .trim()
      .split(" ")
      .filter(x => x);
  }

  if (isScheduler || args.length === 0) {
    const result = await comandoFechar(msg, sock, []);
    return {
      tipo: "fechar",
      ...result
    };
  }

  const hojeBR = new Date();
  const data = hojeBR.toISOString().slice(0, 10);

  const horaInformada = args[0];

  salvarScheduleAction(
    msg.key.remoteJid,
    data,
    horaInformada,
    "../commands/Start_fechar.js",
    "Start_Fechar",
    "!fechar"
  );

  return {
    tipo: "fechar",
    mensagem: `⏰ Ação de FECHAR agendada para ${horaInformada}`
  };
}
