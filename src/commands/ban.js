/* ---------------------------------------------------
   ban.js — Sistema de BAN Global + Expulsão + Alertas + Logs
--------------------------------------------------- */

import fs from "fs";
import path from "path"; // ✅ CORRIGIDO: path importado corretamente
import { aiGenerateReply_Unique01 } from "../core/aiClient.js";

const banPath = path.resolve("src/data/bans.json");

/* ---------------------------------------------------
   Carregar / salvar
--------------------------------------------------- */
function loadBans() {
  if (!fs.existsSync(banPath)) {
    fs.writeFileSync(
      banPath,
      JSON.stringify({ global: [], grupos: {} }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(banPath));
}

function saveBans(data) {
  fs.writeFileSync(banPath, JSON.stringify(data, null, 2));
}

/* ---------------------------------------------------
   Expulsor Universal
--------------------------------------------------- */
async function expulsarDoGrupo(sock, groupId, alvo) {
  const idsPossiveis = [
    `${alvo}@s.whatsapp.net`,
    `${alvo}@lid`,
    `${alvo}@c.us`,
  ];

  for (const jid of idsPossiveis) {
    try {
      await new Promise((r) => setTimeout(r, 200));
      await sock.groupParticipantsUpdate(groupId, [jid], "remove");
      console.log("Expulso com sucesso usando:", jid);
      return true;
    } catch (err) {
      console.log(
        "Erro expulsando com",
        jid,
        err?.output?.payload?.message
      );
    }
  }

  return false;
}

/* ---------------------------------------------------
   /ban
--------------------------------------------------- */
export async function ban(msg, sock, fromClean, args) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  const alvoTag = args[0];
  if (!alvoTag || !alvoTag.startsWith("@")) {
    return { status: "erro", motivo: "formato_invalido" };
  }

  const alvo = alvoTag.replace("@", "").trim();
  const motivo =
    args.length > 1 ? args.slice(1).join(" ") : "sem motivo informado";

  if (alvo === fromClean) {
    return { status: "erro", motivo: "auto_ban" };
  }

  const bans = loadBans();
  bans.global.push({
    alvo,
    admin: fromClean,
    grupoOrigem: groupId,
    motivo,
    data: Date.now(),
  });
  saveBans(bans);

  await expulsarDoGrupo(sock, groupId, alvo);

  const anuncioIA = await aiGenerateReply_Unique01(`
        Gere um anúncio engraçado e sarcástico para um ban REAL.
        Não cite nomes, não marque @, não identifique o alvo.
        Motivo: "${motivo}".
  `);

  const despedida = await aiGenerateReply_Unique01(`
        Gere uma despedida curta e debochada.
        Sem citar nomes nem @.
        Motivo: "${motivo}".
  `);

  return {
    status: "ok",
    tipo: "ban",
    anuncioIA,
    despedida,
  };
}

/* ---------------------------------------------------
   /unban
--------------------------------------------------- */
export async function unban(msg, sock, fromClean, args) {
  const alvoTag = args[0];
  if (!alvoTag || !alvoTag.startsWith("@")) {
    return { status: "erro", motivo: "formato_invalido" };
  }

  const alvo = alvoTag.replace("@", "");
  let bans = loadBans();
  const antes = bans.global.length;

  bans.global = bans.global.filter((b) => b.alvo !== alvo);
  saveBans(bans);

  if (antes === bans.global.length) {
    return { status: "erro", motivo: "nao_existe" };
  }

  return { status: "ok", tipo: "unban" };
}

/* ---------------------------------------------------
   /bans — do grupo
--------------------------------------------------- */
export async function bansGrupo(msg, sock, fromClean) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  const bans = loadBans();
  const lista = bans.global.filter((b) => b.grupoOrigem === groupId);

  if (!lista.length) {
    return {
      status: "ok",
      tipo: "bans_grupo",
      mensagem:
        "📜 *Bans deste grupo*\n\nNenhum ban registrado.",
    };
  }

  let texto = "📜 *Bans deste grupo*\n\n";

  for (const b of lista) {
    texto += `• ID: ${b.alvo}\n`;
    texto += `  Motivo: ${b.motivo}\n\n`;
  }

  return {
    status: "ok",
    tipo: "bans_grupo",
    mensagem: texto,
  };
}

/* ---------------------------------------------------
   /globalbans — com nome dos grupos
--------------------------------------------------- */
export async function bansGlobais(msg, sock, fromClean) {
  const bans = loadBans();

  if (!bans.global.length) {
    return {
      status: "ok",
      tipo: "globalbans",
      mensagem: "🌍 *Bans Globais*\n\nNenhum ban global registrado.",
    };
  }

  let texto = "🌍 *Bans Globais*\n\n";

  for (const b of bans.global) {
    const grupoId = b.grupoOrigem;
    let nomeGrupo = "desconhecido";

    try {
      const meta = await sock.groupMetadata(grupoId);
      nomeGrupo = meta.subject;
    } catch {
      nomeGrupo = "(grupo inacessível)";
    }

    texto += `• ID: ${b.alvo}\n`;
    texto += `  Motivo: ${b.motivo}\n`;
    texto += `  Grupo: ${grupoId.replace("@g.us", "")} — ${nomeGrupo}\n\n`;
  }

  return {
    status: "ok",
    tipo: "globalbans",
    mensagem: texto,
  };
}

/* ---------------------------------------------------
   Alerta: banido entrou no grupo
--------------------------------------------------- */
export async function banCheckEntrada_Unique01(sock, groupId, usuario) {
  const alvo = usuario.replace(/@.*/, "");
  const bans = loadBans();

  const encontrado = bans.global.find((b) => b.alvo === alvo);
  if (!encontrado) return null;

  let meta;
  let nomeGrupo = "desconhecido";

  try {
    meta = await sock.groupMetadata(groupId);
    nomeGrupo = meta.subject;
  } catch {}

  const admins = meta.participants.filter(
    (p) => p.admin === "admin" || p.admin === "superadmin"
  );

  if (!admins.length) return null;

  const alertaIA = await aiGenerateReply_Unique01(`
        Gere um alerta para administradores.
        Diga que um usuário previamente banido entrou no grupo "${nomeGrupo}".
        Motivo: "${encontrado.motivo}".
        Não cite nomes, não use @.
  `);

  const alerta =
    "⚠️ *ALERTA DE ADMINISTRAÇÃO*\n\n" +
    alertaIA +
    `\n\n• ID do banido: *${encontrado.alvo}*` +
    `\n• Grupo: ${nomeGrupo}` +
    `\n• Motivo original: ${encontrado.motivo}`;

  for (const adm of admins) {
    await sock.sendMessage(adm.id, { text: alerta });
  }

  return true;
}

/* ---------------------------------------------------
   FIM
--------------------------------------------------- */
