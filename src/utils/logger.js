// ===== INICIO: LOGGER V2 MONSTRO =====

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

// ===== INICIO: HASH =====
function gerarHash_Unique01(user) {
  return crypto.createHash("sha256").update(user).digest("hex");
}
// ===== FIM =====


// ===== INICIO: GARANTE PASTAS =====
function garantirPastas_Unique02() {
  const pastas = [
    "logs/messages",
    "logs/events",
    "logs/errors",
    "media/images",
    "media/videos",
    "media/audios",
    "media/documents"
  ];

  pastas.forEach((p) => {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  });
}
// ===== FIM =====


// ===== INICIO: DETECTA TIPO MIDIA =====
function detectarTipoMidia_Unique03(msg) {
  if (msg.message?.imageMessage) return "image";
  if (msg.message?.videoMessage) return "video";
  if (msg.message?.audioMessage) return "audio";
  if (msg.message?.documentMessage) return "document";
  return null;
}
// ===== FIM =====


// ===== INICIO: DOWNLOAD MIDIA =====
async function baixarMidia_Unique04(message, tipo) {
  const stream = await downloadContentFromMessage(message, tipo);

  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}
// ===== FIM =====


// ===== INICIO: SALVAR MIDIA =====
function salvarMidia_Unique05(buffer, tipo, mimetype) {
  const ext = mimetype?.split("/")[1] || "bin";

  const hash = crypto.createHash("md5").update(buffer).digest("hex");

  const fileName = `${hash}.${ext}`;

  const pastaMap = {
    image: "images",
    video: "videos",
    audio: "audios",
    document: "documents"
  };

  const dir = path.resolve(`media/${pastaMap[tipo]}`);

  const filePath = path.join(dir, fileName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buffer);
  }

  return {
    path: filePath,
    hash,
    size: buffer.length
  };
}
// ===== FIM =====


// ===== INICIO: LOGGER PRINCIPAL =====
export const botLoggerV2_Unique06 = async (msg) => {
  try {
    garantirPastas_Unique02();

    const data = new Date().toISOString().slice(0, 10);

    const messageFile = path.resolve(`logs/messages/${data}.log`);

    const isGroup = msg.key.remoteJid.endsWith("@g.us");

    const rawUser = msg.key.participant || msg.key.remoteJid;
    const userClean = rawUser.replace(/@.*/, "");

    const tipoMidia = detectarTipoMidia_Unique03(msg);

    let texto =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      null;

    let mediaData = null;

    // ===== MIDIA =====
    if (tipoMidia) {
      const mediaMsg =
        msg.message.imageMessage ||
        msg.message.videoMessage ||
        msg.message.audioMessage ||
        msg.message.documentMessage;

      const buffer = await baixarMidia_Unique04(mediaMsg, tipoMidia);

      const file = salvarMidia_Unique05(
        buffer,
        tipoMidia,
        mediaMsg.mimetype
      );

      mediaData = {
        ...file,
        mimetype: mediaMsg.mimetype,
        caption: mediaMsg.caption || null
      };

      if (!texto) texto = "[MÍDIA]";
    }

    // ===== COMANDO =====
    const isCommand = texto?.startsWith("!");

    // ===== EVENTO FINAL =====
    const entry = {
      event: "message",
      timestamp: new Date().toISOString(),
      data: {
        group: isGroup ? msg.key.remoteJid : null,
        user: gerarHash_Unique01(userClean),
        pushName: msg.pushName || null,
        message: texto,
        isCommand,
        media: mediaData
      }
    };

    fs.appendFileSync(messageFile, JSON.stringify(entry) + "\n");

  } catch (err) {
    const errorFile = path.resolve(
      `logs/errors/${new Date().toISOString().slice(0, 10)}.log`
    );

    fs.appendFileSync(
      errorFile,
      JSON.stringify({
        event: "error",
        timestamp: new Date().toISOString(),
        error: err.message
      }) + "\n"
    );
  }
};
// ===== FIM =====


// ===== INICIO: EVENTOS DE GRUPO =====
export const botLoggerGroupEvent_Unique07 = (eventData) => {
  try {
    garantirPastas_Unique02();

    const file = path.resolve(
      `logs/events/${new Date().toISOString().slice(0, 10)}.log`
    );

    const entry = {
      event: "group_event",
      timestamp: new Date().toISOString(),
      data: eventData
    };

    fs.appendFileSync(file, JSON.stringify(entry) + "\n");

  } catch (err) {
    console.log("Erro ao logar evento de grupo:", err);
  }
};
// ===== FIM =====


// ===== INICIO: PERFIL USUARIO (CACHE LOCAL) =====
export function atualizarUsuario_Unique08(userHash, groupId) {
  const file = path.resolve("logs/users.json");

  let data = {};

  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file));
  }

  if (!data[userHash]) {
    data[userHash] = {
      groups: [],
      messages: 0,
      lastSeen: null
    };
  }

  if (!data[userHash].groups.includes(groupId)) {
    data[userHash].groups.push(groupId);
  }

  data[userHash].messages += 1;
  data[userHash].lastSeen = new Date().toISOString();

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
// ===== FIM =====


// ===== FIM: LOGGER V2 MONSTRO =====