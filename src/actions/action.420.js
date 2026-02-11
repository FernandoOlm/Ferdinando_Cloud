// INÍCIO action.420.js — lembrete diário 4:20 🌿🔥

import fs from "fs";
import path from "path";

const configPath = path.resolve("src/personality/ferdinandoConfig.json");

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(configPath));
}

function saveConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

export default {
  name: "420",

  match: (text) => {
    if (!text) return false;
    const t = text.toLowerCase();
    return (
      t.includes("420") ||
      t.includes("ativar420") ||
      t.includes("desativar420") ||
      t.includes("lembrete 420")
    );
  },

  run: async ({ sock, from, text }) => {
    const t = text.toLowerCase();
    const cfg = loadConfig();

    // ativar
    if (t.includes("ativar420")) {
      if (!cfg.users.find((u) => u.jid === from)) {
        cfg.users.push({ jid: from });
        saveConfig(cfg);
        return await sock.sendMessage(from, {
          text: "🔥🌿 Lembrete 420 ativado no MODO CHAPADÃO™",
        });
      }

      return await sock.sendMessage(from, {
        text: "🔥🌿 Já tô te lembrando, calmou meu consagrado.",
      });
    }

    // desativar
    if (t.includes("desativar420")) {
      cfg.users = cfg.users.filter((u) => u.jid !== from);
      saveConfig(cfg);
      return await sock.sendMessage(from, {
        text: "🚫💨 Lembrete 420 removido. Mas continuo chapando.",
      });
    }

    // sugestão
    if (t.includes("420")) {
      return await sock.sendMessage(from, {
        text: "🌿🔥 O clima ficou VERDE... quer ativar o lembrete? Digita: *ativar420*",
      });
    }

    return null;
  },
};

// FIM
