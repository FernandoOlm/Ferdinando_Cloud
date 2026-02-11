// INÍCIO ajuda.js — Agora dinâmico via help.json

import fs from "fs";

export function comandoAjuda() {

  const db = JSON.parse(
    fs.readFileSync(path.resolve("src/data/help.json"), "utf8")
  );

  let texto = "📘 *Painel de Ajuda — Ferdinando IA*\n\n";
  texto += "Fala, campeão! Aqui vai o manual oficial pra pilotar esse robô sem explodir nada:\n\n";

  for (const cat of db.categorias) {

    texto += "━━━━━━━━━━━━━━━━━━━━━━\n";
    texto += `🔥 *${cat.titulo}*\n`;
    texto += "━━━━━━━━━━━━━━━━━━━━━━\n";

    for (const c of cat.comandos) {
      texto += `• *${c.cmd}* — ${c.desc}\n`;
    }

    texto += "\n";
  }

  texto += "Qualquer dúvida, manda aí. O papai aqui resolve. 😉";

  return texto;
}

// FIM ajuda.js
