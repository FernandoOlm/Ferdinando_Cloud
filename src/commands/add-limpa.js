/* ---------------------------------------------------
   add-limpa.js — ADD + LIMPEZA + DEBUG PESADO
--------------------------------------------------- */

import fs from "fs";
import path from "path";

const banPath = path.resolve("src/data/bans.json");

/* ---------------------------------------------------
   carregar bans
--------------------------------------------------- */
function loadBans() {
  if (!fs.existsSync(banPath)) {
    console.log("📁 bans.json não existe, criando...");
    return { global: [], grupos: {} };
  }
  return JSON.parse(fs.readFileSync(banPath));
}

/* ---------------------------------------------------
   comando principal
--------------------------------------------------- */
export async function addLimpa(msg, sock) {
  console.log("🚀 [ADD-LIMPA] Comando recebido");

  try {
    const groupId = msg.key.remoteJid;
    console.log("📍 Grupo:", groupId);

    if (!groupId || !groupId.endsWith("@g.us")) {
      console.log("❌ Não é grupo");
      return;
    }

    const quoted =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      console.log("❌ Não respondeu mensagem");
      return;
    }

    console.log("📥 Mensagem citada encontrada");

    let vcards = [];

    // 1 contato
    if (quoted.contactMessage?.vcard) {
      console.log("📇 1 vCard detectado");
      vcards.push(quoted.contactMessage.vcard);
    }

    // múltiplos
    if (quoted.contactsArrayMessage?.contacts) {
      console.log(
        `📇 ${quoted.contactsArrayMessage.contacts.length} contatos detectados`
      );

      for (const c of quoted.contactsArrayMessage.contacts) {
        if (c.vcard) vcards.push(c.vcard);
      }
    }

    if (!vcards.length) {
      console.log("❌ Nenhum vCard encontrado");
      return;
    }

    console.log("📦 Total de vcards:", vcards.length);

    /* ---------------------------------------------------
       EXTRAIR NÚMEROS
    --------------------------------------------------- */
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

    numeros = [...new Set(numeros)];

    console.log("📱 Números extraídos:", numeros.length);
    console.log(numeros);

    /* ---------------------------------------------------
       CONTADORES
    --------------------------------------------------- */
    let totalVcards = numeros.length;
    let existeWhats = 0;
    let naoExiste = 0;
    let jaBanido = 0;
    let addBan = 0;

    const bans = loadBans();

    console.log("📚 Bans carregados:", bans.global.length);

    /* ---------------------------------------------------
       PROCESSAMENTO
    --------------------------------------------------- */
    for (const numero of numeros) {
      console.log("\n➡️ Processando:", numero);

      try {
        const jid = `${numero}@s.whatsapp.net`;

        // 🔍 verifica WhatsApp
        const check = await sock.onWhatsApp(jid);

        if (!check || !check.length) {
          console.log("❌ Não tem WhatsApp");
          naoExiste++;
          continue;
        }

        console.log("✅ Existe WhatsApp");
        existeWhats++;

        // 🔒 já banido?
        const isBanido = bans.global.find((b) => b.alvo === numero);

        if (isBanido) {
          console.log("🚫 Já banido");
          jaBanido++;
          continue;
        }

        // ➕ ADD
        try {
          console.log("➕ Tentando adicionar...");
          await sock.groupParticipantsUpdate(groupId, [jid], "add");
          console.log("✅ Adicionado");

          await new Promise((r) => setTimeout(r, 1200));
        } catch (err) {
          console.log("❌ Falha ao adicionar:", err?.message);
          continue;
        }

        // ❌ REMOVE
        try {
          console.log("🗑️ Removendo...");
          await sock.groupParticipantsUpdate(groupId, [jid], "remove");

          bans.global.push({
            alvo: numero,
            admin: "system-add-limpa",
            grupoOrigem: groupId,
            motivo: "add-limpa",
            data: Date.now(),
          });

          console.log("🔥 Add + Ban concluído");

          addBan++;
          await new Promise((r) => setTimeout(r, 1200));

        } catch (err) {
          console.log("❌ Falha ao remover:", err?.message);
          continue;
        }

      } catch (err) {
        console.log("💥 Erro geral:", err?.message);
        continue;
      }
    }

    fs.writeFileSync(banPath, JSON.stringify(bans, null, 2));
    console.log("💾 Bans salvos");

    /* ---------------------------------------------------
       RESPOSTA FINAL
    --------------------------------------------------- */
    const resposta =
      `🧹 *RELATÓRIO ADD-LIMPA*\n\n` +
      `📇 VCards analisados: ${totalVcards}\n` +
      `📱 Existem no WhatsApp: ${existeWhats}\n` +
      `🚫 Já eram banidos: ${jaBanido}\n` +
      `⚔️ Add + Ban: ${addBan}\n` +
      `❌ Não possuem WhatsApp: ${naoExiste}`;

    console.log("📤 Enviando resposta final");

    await sock.sendMessage(groupId, { text: resposta });

    console.log("✅ FINALIZADO");

  } catch (err) {
    console.log("💥 ERRO FATAL:", err);
  }
}