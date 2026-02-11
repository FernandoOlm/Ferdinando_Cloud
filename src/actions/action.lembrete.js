// INÍCIO action.lembrete.js — lembretes gerais

import { getMemory_Unique01, saveMemory_Unique01 } from "../core/clawMemory.js";

export default {
  name: "lembrete",

  match: (text) => {
    if (!text || typeof text !== "string") return false;
    const t = text.toLowerCase();
    return (
      t.includes("me lembra") ||
      t.includes("lembrete") ||
      t.includes("quero um lembrete") ||
      t.includes("ativar 420") ||
      t.includes("lembrar 420")
    );
  },

  run: async ({ sock, from, text }) => {
    if (!text || typeof text !== "string") return null;

    const lower = text.toLowerCase();
    const memory = getMemory_Unique01(from) || {};
    if (!memory.lembrete420) memory.lembrete420 = {};

    // pedir confirmação
    if (lower.includes("ativar 420") || lower.includes("lembrar 420")) {
      memory.lembrete420.confirmar = true;
      saveMemory_Unique01(from, memory);

      return await sock.sendMessage(from, {
        text: "💨 Quer que eu te avise *todo dia* quando for 4:20? (sim / não)",
      });
    }

    // usuário confirmou
    if (memory.lembrete420.confirmar && lower.includes("sim")) {
      memory.lembrete420.ativo = true;
      memory.lembrete420.confirmar = false;
      saveMemory_Unique01(from, memory);

      return await sock.sendMessage(from, {
        text: "🔥 Fechou mano! Te aviso TODO DIA às 4:20 🌿🔥",
      });
    }

    // usuário negou
    if (memory.lembrete420.confirmar && lower.includes("não")) {
      memory.lembrete420.confirmar = false;
      saveMemory_Unique01(from, memory);

      return await sock.sendMessage(from, {
        text: "Suave, mano 😎 qualquer coisa dá um toque.",
      });
    }

    return null;
  },
};

// FIM
