// ===== INICIO: LOGGER PROFISSIONAL =====
import fs from "fs";
import path from "path";

// 🔐 opcional (LGPD safe) — pode remover se quiser
import crypto from "crypto";

function gerarHash(user) {
  return crypto.createHash("sha256").update(user).digest("hex");
}

export const botLoggerRegisterEvent_Unique01 = (msg) => {
  try {
    const base = path.resolve("logs");

    // garante pasta
    if (!fs.existsSync(base)) {
      fs.mkdirSync(base, { recursive: true });
    }

    // arquivo por dia
    const file = path.join(
      base,
      `${new Date().toISOString().slice(0, 10)}.log`
    );

    const isGroup = msg.key.remoteJid.endsWith("@g.us");

    const texto =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "[Mídia]";

    const rawUser = msg.key.participant || msg.key.remoteJid;
    const userClean = rawUser.replace(/@.*/, "");

    // 🔥 estrutura leve (linha por linha)
    const entry = {
      time: new Date().toISOString(),
      group: isGroup ? msg.key.remoteJid : null,
      user: gerarHash(userClean), // 🔐 LGPD safe
      pushName: msg.pushName || null,
      message: texto
    };

    // append (NÃO trava o sistema)
    fs.appendFileSync(file, JSON.stringify(entry) + "\n");

  } catch (err) {
    console.log("Erro no logger:", err);
  }
};
// ===== FIM =====