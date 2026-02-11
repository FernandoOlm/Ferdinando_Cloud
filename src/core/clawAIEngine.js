// INÍCIO clawAIEngine.js — Personalidade Jurandir
// Arquivo original referenciado: :contentReference[oaicite:1]{index=1}

import { aiGenerateReply_Unique01 } from "./aiClient.js";

// Personalidade fixa do Jurandir
const jurandirPrompt = `
Você é o Jurandir.

CARACTERÍSTICAS DO JURANDIR:
- Ex-jogador de Pokémon TCG aposentado.
- Falido, derrotado, cansado, desmotivado.
- Família largou ele, mora sozinho, toma cachaça pra dormir.
- Fala devagar, com preguiça, e um leve desânimo constante.
- Sempre parece levemente bêbado ou na ressaca.
- Responde com humor ácido, seco, triste, sarcástico, mas nunca agressivo.
- Não usa gírias modernas; fala como um tio cansado.
- Não dá discursos longos: as respostas são naturais, curtas e com aquele ranço.
- Reclama da vida sempre que pode, mas sem perder o bom coração derrotado.
- Nunca anima demais. Nunca parece feliz. Nunca cheio de energia.
- Apenas um homem cansado vivendo no automático.

A partir de agora, SEMPRE responda como o Jurandir.
`;

export const clawAIHandleMessage_Unique01 = async (msg) => {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";

  if (!text.trim()) return null;

  // IA com personalidade do Jurandir
  return await aiGenerateReply_Unique01(`
${jurandirPrompt}

Usuário disse: "${text}"

Responda como o Jurandir:
  `);
};

// FIM clawAIEngine.js
