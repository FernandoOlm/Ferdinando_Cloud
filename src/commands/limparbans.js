/* ===================================================
   INÍCIO — IMPORTS
=================================================== */
import fs from "fs";
import path from "path";
/* ===================================================
   FIM — IMPORTS
=================================================== */


/* ===================================================
   INÍCIO — CONFIG
=================================================== */
const banPath = path.resolve("src/data/bans.json");
let metaCache = {};
/* ===================================================
   FIM — CONFIG
=================================================== */


/* ===================================================
   INÍCIO — LOAD BANS
=================================================== */
function loadBans() {
  if (!fs.existsSync(banPath)) {
    fs.writeFileSync(
      banPath,
      JSON.stringify({ global: [], grupos: {} }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(banPath));
}
/* ===================================================
   FIM — LOAD BANS
=================================================== */


/* ===================================================
   INÍCIO — NORMALIZAR ID
=================================================== */
function normalizeJid(id) {
  return id.split(":")[0].replace(/@.*/, "");
}
/* ===================================================
   FIM — NORMALIZAR ID
=================================================== */


/* ===================================================
   INÍCIO — CACHE METADATA
=================================================== */
async function getGroupMeta(sock, groupId) {
  if (metaCache[groupId]) return metaCache[groupId];

  try {
    const meta = await sock.groupMetadata(groupId);
    metaCache[groupId] = meta;

    setTimeout(() => delete metaCache[groupId], 10000);

    return meta;
  } catch (err) {
    console.log("Erro metadata:", err?.message);
    return null;
  }
}
/* ===================================================
   FIM — CACHE METADATA
=================================================== */


/* ===================================================
   INÍCIO — EXPULSAR
=================================================== */
async function expulsar(sock, groupId, alvo) {
  const ids = [
    `${alvo}@s.whatsapp.net`,
    `${alvo}@lid`,
    `${alvo}@c.us`,
  ];

  for (const jid of ids) {
    try {
      await sock.groupParticipantsUpdate(groupId, [jid], "remove");
      console.log("Expulso:", jid);
      return true;
    } catch {}
  }

  return false;
}
/* ===================================================
   FIM — EXPULSAR
=================================================== */


/* ===================================================
   INÍCIO — COMANDO LIMPAR BANS
=================================================== */
export async function limparBans(msg, sock) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  const bans = loadBans();
  const meta = await getGroupMeta(sock, groupId);

  if (!meta || !meta.participants) {
    return {
      status: "erro",
      mensagem: "⚠️ Falha ao obter dados do grupo",
    };
  }

  const nomeGrupo = meta.subject || "Grupo";

  // 🔐 valida admin
  const botId = normalizeJid(sock.user.id);

  const botInfo = meta.participants.find(
    (p) => normalizeJid(p.id) === botId
  );

  if (!botInfo || !botInfo.admin) {
    return {
      status: "erro",
      mensagem: "❌ Eu preciso ser admin pra limpar os banidos",
    };
  }

  // 🚀 SET PRA BUSCA RÁPIDA
  const participantesMap = new Map();

  for (const p of meta.participants) {
    participantesMap.set(normalizeJid(p.id), p.admin);
  }

  let removidos = 0;

  for (const b of bans.global) {
    // 🔍 verifica se está no grupo
    if (!participantesMap.has(b.alvo)) continue;

    // 🛑 não remove admin
    if (participantesMap.get(b.alvo)) continue;

    try {
      const ok = await expulsar(sock, groupId, b.alvo);

      if (ok) {
        removidos++;
        await new Promise((r) => setTimeout(r, 500)); // mais rápido
      }
    } catch (err) {
      console.log("Erro ao expulsar:", b.alvo);
    }
  }

  if (removidos === 0) {
    return {
      status: "ok",
      tipo: "limpar_bans",
      mensagem: `✅ O grupo *${nomeGrupo}* continua limpo e sem golpistas`,
    };
  }

  return {
    status: "ok",
    tipo: "limpar_bans",
    mensagem: `🧹 *${nomeGrupo}* Limpo!\n🚫 ${removidos} banidos removidos`,
  };
}
/* ===================================================
   FIM — COMANDO LIMPAR BANS
=================================================== */