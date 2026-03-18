// ===== INICIO: LOGGER V3 MONSTRO =====

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

// ===== INICIO: BASE PATH =====
const BASE_PATH = path.resolve("src/data");
// ===== FIM =====


// ===== INICIO: HASH =====
function gerarHash_Unique01(user) {
  return crypto.createHash("sha256").update(user).digest("hex");
}
// ===== FIM =====


// ===== INICIO: GARANTE PASTAS =====
function garantirPastas_Unique02() {
  const pastas = [
    `${BASE_PATH}/logs/messages`,
    `${BASE_PATH}/logs/events`,
    `${BASE_PATH}/logs/errors`,
    `${BASE_PATH}/logs/groups`,
    `${BASE_PATH}/logs/users`,
    `${BASE_PATH}/media/images`,
    `${BASE_PATH}/media/videos`,
    `${BASE_PATH}/media/audios`,
    `${BASE_PATH}/media/documents`
  ];

  pastas.forEach((p) => {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });
}
// ===== FIM =====


// ===== INICIO: DETECTA MIDIA =====
function detectarTipoMidia_Unique03(msg) {
  if (msg.message?.imageMessage) return "image";
  if (msg.message?.videoMessage) return "video";
  if (msg.message?.audioMessage) return "audio";
  if (msg.message?.documentMessage) return "document";
  return "text";
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

  const pastaMap = {
    image: "images",
    video: "videos",
    audio: "audios",
    document: "documents"
  };

  const dir = path.resolve(`${BASE_PATH}/media/${pastaMap[tipo]}`);
  const filePath = path.join(dir, `${hash}.${ext}`);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buffer);
  }

  return {
    path: filePath.replace(BASE_PATH, ""),
    hash,
    size: buffer.length
  };
}
// ===== FIM =====


// ===== INICIO: ATUALIZA USUARIO =====
function atualizarUsuario_Unique06(userHash, groupId, tipoMsg) {
  const file = path.resolve(`${BASE_PATH}/logs/users/users.json`);

  let data = {};
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file));

  if (!data[userHash]) {
    data[userHash] = {
      groups: [],
      totalMessages: 0,
      mediaCount: 0,
      textCount: 0,
      lastSeen: null
    };
  }

  if (!data[userHash].groups.includes(groupId)) {
    data[userHash].groups.push(groupId);
  }

  data[userHash].totalMessages++;
  if (tipoMsg === "text") data[userHash].textCount++;
  else data[userHash].mediaCount++;

  data[userHash].lastSeen = new Date().toISOString();

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
// ===== FIM =====


// ===== INICIO: LOGGER DE MENSAGEM =====
export const botLoggerV3_Message_Unique07 = async (msg) => {
  try {
    garantirPastas_Unique02();

    const data = new Date().toISOString().slice(0, 10);
    const file = path.resolve(`${BASE_PATH}/logs/messages/${data}.log`);

    const isGroup = msg.key.remoteJid.endsWith("@g.us");
    const rawUser = msg.key.participant || msg.key.remoteJid;
    const userClean = rawUser.replace(/@.*/, "");
    const userHash = gerarHash_Unique01(userClean);

    const tipo = detectarTipoMidia_Unique03(msg);

    let texto =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      null;

    let media = null;

    if (tipo !== "text") {
      const mediaMsg =
        msg.message.imageMessage ||
        msg.message.videoMessage ||
        msg.message.audioMessage ||
        msg.message.documentMessage;

      const buffer = await baixarMidia_Unique04(mediaMsg, tipo);

      const fileData = salvarMidia_Unique05(
        buffer,
        tipo,
        mediaMsg.mimetype
      );

      media = {
        ...fileData,
        mimetype: mediaMsg.mimetype,
        caption: mediaMsg.caption || null
      };

      if (!texto) texto = "[MÍDIA]";
    }

    const entry = {
      event: "message",
      timestamp: new Date().toISOString(),
      data: {
        group: isGroup ? msg.key.remoteJid : null,
        user: userHash,
        pushName: msg.pushName || null,
        message: texto,
        type: tipo,
        isCommand: texto?.startsWith("!"),
        hasMedia: tipo !== "text",
        isReply: !!msg.message?.extendedTextMessage?.contextInfo,
        mentions:
          msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
        media
      }
    };

    fs.appendFileSync(file, JSON.stringify(entry) + "\n");

    atualizarUsuario_Unique06(userHash, entry.data.group, tipo);

  } catch (err) {
    registrarErro_Unique09(err);
  }
};
// ===== FIM =====


// ===== INICIO: EVENTOS DE GRUPO =====
export const botLoggerV3_GroupEvent_Unique08 = (eventData) => {
  try {
    garantirPastas_Unique02();

    const file = path.resolve(
      `${BASE_PATH}/logs/events/${new Date().toISOString().slice(0, 10)}.log`
    );

    fs.appendFileSync(
      file,
      JSON.stringify({
        event: "group_event",
        timestamp: new Date().toISOString(),
        data: eventData
      }) + "\n"
    );
  } catch (err) {
    registrarErro_Unique09(err);
  }
};
// ===== FIM =====


// ===== INICIO: LOG DE ERRO =====
function registrarErro_Unique09(err) {
  const file = path.resolve(
    `${BASE_PATH}/logs/errors/${new Date().toISOString().slice(0, 10)}.log`
  );

  fs.appendFileSync(
    file,
    JSON.stringify({
      event: "error",
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack
    }) + "\n"
  );
}
// ===== FIM =====


// ===== FIM: LOGGER V3 MONSTRO =====