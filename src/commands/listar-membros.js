// ================================
// INÍCIO DO ARQUIVO listar-membros.js
// ================================

export async function comandoListarMembros(msg, sock) {
  try {
    const jid = msg.key.remoteJid;
    const meta = await sock.groupMetadata(jid);

    const numeros = [];

    for (const participante of meta.participants) {
      const wid = participante.id;

      if (!wid) continue;

      const partes = wid.split("@");
      const numero = partes[0];
      const dominio = partes[1];

      if (dominio === "c.us" || dominio === "s.whatsapp.net") {
        numeros.push(`+${numero}`);
      }
    }

    const textoFinal =
      `${meta.subject}\n\n` +
      (numeros.length ? numeros.join("\n") : "Nenhum número encontrado.");

    // 🔥 ENVIA DIRETO PRO GRUPO
    await sock.sendMessage(jid, { text: textoFinal });

  } catch (erro) {
    console.error("Erro ao listar membros:", erro);

    await sock.sendMessage(msg.key.remoteJid, {
      text: "Erro ao listar membros."
    });
  }
}

// ================================
// FIM DO ARQUIVO listar-membros.js
// ================================