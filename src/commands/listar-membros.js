// ================================
// INÍCIO DO ARQUIVO listar-membros.js
// ================================

export async function comandoListarMembros(msg, sock) {
  try {
    // ================================
    // INÍCIO - CAPTURA DADOS DO GRUPO
    // ================================
    const jid = msg.key.remoteJid;
    const meta = await sock.groupMetadata(jid);
    // ================================
    // FIM - CAPTURA DADOS DO GRUPO
    // ================================

    // ================================
    // INÍCIO - EXTRAÇÃO DE NÚMEROS
    // ================================
    const numerosSet = new Set();

    for (const participante of meta.participants) {
      const wid = participante.id; // ex: 5511999999999@s.whatsapp.net
      const [numero, dominio] = wid.split("@");

      // Só pega números reais (ignora LID / usuários ocultos)
      if (dominio === "c.us" || dominio === "s.whatsapp.net") {
        numerosSet.add(`+${numero}`);
      }
    }
    // ================================
    // FIM - EXTRAÇÃO DE NÚMEROS
    // ================================

    // ================================
    // INÍCIO - FORMATAÇÃO FINAL
    // ================================
    const listaNumeros = [...numerosSet];

    const textoFinal =
      `${meta.subject}\n\n` +
      (listaNumeros.length > 0
        ? listaNumeros.join("\n")
        : "Nenhum número encontrado.");
    // ================================
    // FIM - FORMATAÇÃO FINAL
    // ================================

    // ================================
    // INÍCIO - RETORNO
    // ================================
    return {
      tipo: "texto",
      texto: textoFinal
    };
    // ================================
    // FIM - RETORNO
    // ================================

  } catch (erro) {
    // ================================
    // INÍCIO - TRATAMENTO DE ERRO
    // ================================
    console.error("Erro ao listar membros:", erro);

    return {
      tipo: "texto",
      texto: "Erro ao listar membros do grupo."
    };
    // ================================
    // FIM - TRATAMENTO DE ERRO
    // ================================
  }
}

// ================================
// FIM DO ARQUIVO listar-membros.js
// ================================