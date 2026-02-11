// INÍCIO listar-membros.js — versão adaptada PROFISSIONAL

export async function comandoListarMembros(msg, sock) {
  const jid = msg.key.remoteJid;
  const meta = await sock.groupMetadata(jid);

  const membros = [];

  for (const p of meta.participants) {
    const wid = p.id;                // ex: 55119..@c.us ou 1234..@lid
    const base = wid.split("@")[0];  // número ou LID
    const dominio = wid.split("@")[1];

    // Nome detectável
    const nomeDetectado =
      p.notify ||
      p.name ||
      p.vname ||
      null;

    let nomeFinal = "Oculto";

    // Se for número real
    if (dominio === "c.us" || dominio === "s.whatsapp.net") {
      nomeFinal = nomeDetectado ? nomeDetectado : "Sem nome";
    } else {
      // É LID
      nomeFinal = nomeDetectado ? `${nomeDetectado} (privado)` : "Oculto";
    }

    membros.push(`${base} | ${nomeFinal}`);
  }

  return {
    tipo: "listar_membros",
    membros
  };
}

// FIM listar-membros.js
