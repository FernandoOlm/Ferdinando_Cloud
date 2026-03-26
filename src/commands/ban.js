/* ---------------------------------------------------
   ban.js — Sistema de BAN Global + Expulsão + Alertas + Logs
--------------------------------------------------- */

import fs from "fs";
import path from "path";
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
      console.log("Erro expulsando com", jid, err?.output?.payload?.message);
    }
  }

  return false;
}

/* ---------------------------------------------------
   /ban (MULTI USER 🔥)
--------------------------------------------------- */
export async function ban(msg, sock, fromClean, args) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  const alvosTags = args.filter((a) => a.startsWith("@"));

  if (!alvosTags.length) {
    return { status: "erro", motivo: "formato_invalido" };
  }

  const motivoParts = args.filter((a) => !a.startsWith("@"));
  const motivo =
    motivoParts.length > 0 ? motivoParts.join(" ") : "sem motivo informado";

  const bans = loadBans();
  let banidos = [];

  for (const alvoTag of alvosTags) {
    const alvo = alvoTag.replace("@", "").replace(/\D/g, "");

    if (alvo === fromClean) continue;

    bans.global.push({
      alvo,
      admin: fromClean,
      grupoOrigem: groupId,
      motivo,
      data: Date.now(),
    });

    const sucesso = await expulsarDoGrupo(sock, groupId, alvo);

    if (sucesso) {
      banidos.push(alvo);
    }
  }

  saveBans(bans);

  if (!banidos.length) {
    return { status: "erro", motivo: "falha_expulsao" };
  }

  const anuncioIA = await aiGenerateReply_Unique01(`
        Gere um anúncio engraçado e sarcástico para bans em massa.
        Não cite nomes, não marque @.
        Quantidade: ${banidos.length}
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
    total: banidos.length,
    anuncioIA,
    despedida,
  };
}

/* ---------------------------------------------------
   /unban — REMOVE TODAS AS OCORRÊNCIAS 🔥
--------------------------------------------------- */
export async function unban(msg, sock, fromClean, args) {
  const alvoTag = args[0];

  if (!alvoTag || !alvoTag.startsWith("@")) {
    return { status: "erro", motivo: "formato_invalido" };
  }

  const alvo = alvoTag.replace("@", "").replace(/\D/g, "");

  let bans = loadBans();

  const antes = bans.global.length;

  bans.global = bans.global.filter((b) => b.alvo !== alvo);

  const depois = bans.global.length;

  saveBans(bans);

  const removidos = antes - depois;

  if (removidos === 0) {
    return {
      status: "erro",
      motivo: "nao_existe",
    };
  }

  return {
    status: "ok",
    tipo: "unban",
    removidos,
  };
}

/* ---------------------------------------------------
   /bans — do grupo
--------------------------------------------------- */
export async function bansGrupo(msg, sock) {
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
      mensagem: "📜 *Bans deste grupo*\n\nNenhum ban registrado.",
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
   /globalbans
--------------------------------------------------- */
export async function bansGlobais(msg, sock) {
  const chatId = msg.key.remoteJid;
  const bans = loadBans();

  if (!bans.global.length) {
    const texto = "🌍 *Bans Globais*\n\nNenhum ban global registrado.";
    await sock.sendMessage(chatId, { text: texto });

    return { status: "ok", tipo: "globalbans", mensagem: texto };
  }

  let texto = "🌍 *Bans Globais*\n\n";

  for (const b of bans.global) {
    let nomeGrupo = "desconhecido";

    try {
      const meta = await sock.groupMetadata(b.grupoOrigem);
      nomeGrupo = meta.subject;
    } catch {
      nomeGrupo = "(grupo inacessível)";
    }

    texto += `• ID: ${b.alvo}\n`;
    texto += `  Motivo: ${b.motivo}\n`;
    texto += `  Grupo: ${b.grupoOrigem.replace("@g.us", "")} — ${nomeGrupo}\n\n`;
  }

  await sock.sendMessage(chatId, { text: texto });

  return { status: "ok", tipo: "globalbans", mensagem: texto };
}

/* ---------------------------------------------------
   ALERTA entrada banido
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
        Um usuário banido entrou no grupo "${nomeGrupo}".
        Motivo: "${encontrado.motivo}".
  `);

  const alerta =
    "⚠️ *ALERTA*\n\n" +
    alertaIA +
    `\n\n• ID: ${encontrado.alvo}` +
    `\n• Grupo: ${nomeGrupo}`;

  for (const adm of admins) {
    await sock.sendMessage(adm.id, { text: alerta });
  }

  return true;
}

/* ---------------------------------------------------
   /limpar-bans
--------------------------------------------------- */
export async function limparBans(msg, sock) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  const bans = loadBans();

  let meta;
  try {
    meta = await sock.groupMetadata(groupId);
  } catch {
    return { status: "erro", mensagem: "Erro ao acessar grupo" };
  }

  const participantes = meta.participants.map((p) => ({
    id: p.id.replace(/@.*/, ""),
    admin: p.admin,
  }));

  let removidos = 0;

  for (const b of bans.global) {
    const alvoInfo = participantes.find((p) => p.id === b.alvo);

    if (!alvoInfo || alvoInfo.admin) continue;

    const sucesso = await expulsarDoGrupo(sock, groupId, b.alvo);

    if (sucesso) {
      removidos++;
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  return {
    status: "ok",
    tipo: "limpar_bans",
    mensagem: `🧹 ${removidos} banidos removidos`,
  };
}

/* ---------------------------------------------------
   FIM
--------------------------------------------------- */