// INÍCIO anuncia.js
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve("src/data/anuncios.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { grupos: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export async function autorizarAnuncio(msg, sock, fromClean, args) {
  try {
    const jid = msg.key.remoteJid;

    // pegar @usuario
    const mencoes = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mencoes || mencoes.length === 0) {
      return "Use: !anuncia @fulano";
    }

    const alvo = mencoes[0]; // exemplo: 554188888888@s.whatsapp.net

    // carregar DB
    const db = loadDB();

    // criar grupo se não existir
    if (!db.grupos[jid]) {
      db.grupos[jid] = { autorizados: [] };
    }

    // adicionar se não tiver
    if (!db.grupos[jid].autorizados.includes(alvo)) {
      db.grupos[jid].autorizados.push(alvo);
    }

    // salvar
    saveDB(db);

    return {
      mensagem: `@${alvo.replace("@s.whatsapp.net","")} está autorizado a anunciar no grupo.`,
      mentions: [alvo]
    };

  } catch (err) {
    console.log("Erro no comando !anuncia:", err);
    return "Erro ao autorizar anúncio.";
  }
}
// FIM anuncia.js
