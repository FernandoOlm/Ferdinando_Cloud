//////////////////////////////
// INÍCIO cmdListarLembretes
export async function cmdListarLembretes(msg, sock, args) {
  const fs = await import("fs");
  const path = await import("path");

  try {
    const jid = msg.key.remoteJid;

    // INÍCIO carregar_json
    const filePath = path.resolve("src/data/reminders.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const db = JSON.parse(raw);
    // FIM carregar_json

    // INÍCIO filtrar_grupo
    const lista = db.lembretes.filter(l => l.grupo === jid);
    // FIM filtrar_grupo

    if (lista.length === 0) {
      await sock.sendMessage(jid, { text: "📝 Nenhum lembrete ativo para este grupo." });
      return;
    }

    // INÍCIO montar_resposta
    let txt = "📌 *Lembretes deste grupo:*\n\n";

    for (const item of lista) {
      const quandoBR = new Date(item.quando).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo"
      });

      txt += `🔹 *ID:* ${item.id}\n`;
      txt += `🕒 ${quandoBR}\n`;
      txt += `💬 ${item.texto}\n`;
      txt += `🔁 Repetição: ${item.repeat || "nenhuma"}\n`;
      if (item.tipoEspecial) txt += `⚙ Tipo especial: ${item.tipoEspecial}\n`;
      txt += `----------------------------------\n`;
    }
    // FIM montar_resposta

    // INÍCIO envio
    await sock.sendMessage(jid, { text: txt });
    // FIM envio

  } catch (e) {
    console.error("Erro listar lembretes:", e);
  }
}
// FIM cmdListarLembretes
//////////////////////////////