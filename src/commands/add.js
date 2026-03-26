/* ---------------------------------------------------
   add.js — Adição silenciosa via vCard (STEALTH MODE)
--------------------------------------------------- */

export async function add(msg, sock) {
  try {
    const groupId = msg.key.remoteJid;

    // só grupo
    if (!groupId || !groupId.endsWith("@g.us")) return;

    const quoted =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return;

    let vcards = [];

    // 1 contato
    if (quoted.contactMessage?.vcard) {
      vcards.push(quoted.contactMessage.vcard);
    }

    // múltiplos contatos
    if (quoted.contactsArrayMessage?.contacts) {
      for (const c of quoted.contactsArrayMessage.contacts) {
        if (c.vcard) vcards.push(c.vcard);
      }
    }

    if (!vcards.length) return;

    let numeros = [];

    for (const vcard of vcards) {
      const matches = vcard.match(/TEL[^:]*:(.+)/gi);

      if (!matches) continue;

      for (const linha of matches) {
        let numero = linha.split(":")[1];

        if (!numero) continue;

        numero = numero.replace(/\D/g, "");

        if (numero.length >= 10) {
          numeros.push(numero);
        }
      }
    }

    // remove duplicados
    numeros = [...new Set(numeros)];

    if (!numeros.length) return;

    // adiciona silenciosamente
    for (const numero of numeros) {
      try {
        await sock.groupParticipantsUpdate(
          groupId,
          [`${numero}@s.whatsapp.net`],
          "add"
        );

        // delay leve anti-ban
        await new Promise((r) => setTimeout(r, 1200));

      } catch {
        // ignora tudo
        continue;
      }
    }

  } catch {
    // silêncio absoluto
    return;
  }
}