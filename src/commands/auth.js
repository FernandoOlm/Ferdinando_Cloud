// INÍCIO auth.js
import fs from "fs";
import path from "path";

const AUTH_PATH = path.resolve("src/data/auth/allowed.json");

export function ensureAuthFile() {
  if (!fs.existsSync(AUTH_PATH)) {
    fs.mkdirSync(path.dirname(AUTH_PATH), { recursive: true });
    fs.writeFileSync(
      AUTH_PATH,
      JSON.stringify({ grupos: {}, privados: {} }, null, 2)
    );
  }
}

function loadJSON() {
  ensureAuthFile();
  return JSON.parse(fs.readFileSync(AUTH_PATH));
}

function saveJSON(obj) {
  fs.writeFileSync(AUTH_PATH, JSON.stringify(obj, null, 2));
}

// ===================================================
// AUTORIZAÇÃO COMPLETA COM PAGADOR E SISTEMA POR GRUPO/PV
// ===================================================
export function autorizarUsuario(rootId, msg, texto) {
  const raw = msg.key.participant || msg.key.remoteJid;
  const fromClean = raw.replace(/@.*/, "");

  if (fromClean !== rootId) {
    return {
      status: "erro",
      tipo: "autorizar",
      motivo: "nao_root",
    };
  }

  const match = texto.match(/@(\d{5,})/);
  if (!match) {
    return {
      status: "erro",
      tipo: "autorizar",
      motivo: "formato_invalido",
    };
  }

  const userToAdd = match[1];
  const jid = msg.key.remoteJid;

  const db = loadJSON();

  // ===================================================
  // PV
  // ===================================================
  if (!jid.endsWith("@g.us")) {
    if (!db.privados[userToAdd]) {
      db.privados[userToAdd] = {
        pagador: userToAdd,
        autorizados: [userToAdd],
      };
    } else {
      if (!db.privados[userToAdd].autorizados.includes(userToAdd)) {
        db.privados[userToAdd].autorizados.push(userToAdd);
      }
    }

    saveJSON(db);

    return {
      status: "ok",
      tipo: "autorizar",
      escopo: "pv",
      usuario: userToAdd,
      pagador: db.privados[userToAdd].pagador,
    };
  }

  // ===================================================
  // GRUPO
  // ===================================================
  const groupName = msg.pushName || "Grupo";

  if (!db.grupos[jid]) {
    db.grupos[jid] = {
      nome: groupName,
      pagador: userToAdd,
      autorizados: [userToAdd],
    };
  } else {
    if (!db.grupos[jid].autorizados.includes(userToAdd)) {
      db.grupos[jid].autorizados.push(userToAdd);
    }
  }

  saveJSON(db);

  return {
    status: "ok",
    tipo: "autorizar",
    escopo: "grupo",
    grupo: jid,
    nomeGrupo: db.grupos[jid].nome,
    usuario: userToAdd,
    pagador: db.grupos[jid].pagador,
  };
}
// FIM auth.js
