/* ===================================================
   INÍCIO — IMPORTS E CONFIG
=================================================== */
import fs from "fs";
import path from "path";

const banPath = path.resolve("src/data/bans.json");
/* ===================================================
   FIM — IMPORTS E CONFIG
=================================================== */


/* ===================================================
   INÍCIO — UTIL LOAD BANS
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
   FIM — UTIL LOAD BANS
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
   INÍCIO — EXPULSAR UNIVERSAL
=================================================== */
async function expulsar(sock, groupId, alvo) {
  const ids = [
    `${alvo}@s.whatsapp.net`,
    `${alvo}@lid`,
    `${alvo}@c.us`,
  ];

  for (const jid of ids) {
    try {
      await new Promise(r => setTimeout(r, 200));
      await sock.groupParticipantsUpdate(groupId, [jid], "remove");
      console.log("Expulso:", jid);
      return true;
    } catch (err) {
      console.log("Falha com", jid);
    }
  }

  return false;
}
/* ===================================================
   FIM — EXPULSAR UNIVERSAL
=================================================== */


/* ===================================================
   INÍCIO — COMANDO LIMPAR BANS
=================================================== */
export async function limparBans(msg, sock) {
  const groupId = msg.key.remoteJid;

  if (!groupId.endsWith("@g.us")) {
    return { status: "erro", motivo: "nao_grupo" };
  }

  let meta;
  let nomeGrupo = "Grupo";

  try {
    meta = await sock.groupMetadata(groupId);
    nomeGrupo = meta.subject;
  } catch {
    return {
      status: "erro",
      mensagem: "❌ erro ao obter dados do grupo",
    };
  }

  const bans = loadBans();

  // 🔐 valida bot admin (CORRIGIDO)
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

  const participantes = meta.participants.map((p) => ({
    id: normalizeJid(p.id),
    admin: p.admin,
  }));

  let removidos = 0;

  for (const b of bans.global) {
    const alvo = participantes.find((p) => p.id === b.alvo);

    if (!alvo) continue;

    // 🛑 não remove admin
    if (alvo.admin) continue;

    try {
      const ok = await expulsar(sock, groupId, b.alvo);

      if (ok) {
        removidos++;
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (err) {
      console.log("Erro ao expulsar:", b.alvo);
      continue;
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