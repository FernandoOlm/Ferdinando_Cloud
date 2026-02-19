/* INÍCIO apagar-lembrete.js */

import fs from "fs";
import path from "path";

// INÍCIO cmdApagarLembrete
export async function cmdApagarLembrete(msg, sock, args) {
  try {
    const jid = msg.key.remoteJid;

    // INÍCIO validar_args
    if (!args[0] || isNaN(args[0])) {
      await sock.sendMessage(jid, { text: "❌ Use: !apagar-lembrete ID" });
      return;
    }
    const id = Number(args[0]);
    // FIM validar_args

    // INÍCIO carregar_json
    const filePath = path.resolve("src/data/reminders.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const db = JSON.parse(raw);
    // FIM carregar_json

    // INÍCIO localizar
    const existe = db.lembretes.some(l => l.id === id && l.grupo === jid);
    if (!existe) {
      await sock.sendMessage(jid, { text: "❌ Lembrete não encontrado para este grupo." });
      return;
    }
    // FIM localizar

    // INÍCIO remover
    db.lembretes = db.lembretes.filter(l => !(l.id === id && l.grupo === jid));
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    // FIM remover

    // INÍCIO enviar
    await sock.sendMessage(jid, {
      text: `🗑️ Lembrete *${id}* apagado com sucesso!`
    });
    // FIM enviar

  } catch (err) {
    console.error("Erro ao apagar lembrete:", err);
  }
}
// FIM cmdApagarLembrete

/* FIM apagar-lembrete.js */