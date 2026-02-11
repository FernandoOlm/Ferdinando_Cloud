// INÍCIO aiClient.js — Ferdinando Pokémon, mas comandos sem Pokémon

import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function aiGenerateReply_Unique01(prompt) {
  try {
    const isCommand = typeof prompt === "string" && prompt.trim().startsWith("/");

    const systemPrompt = isCommand
      ? `
Responda SEM mencionar Pokémon, cartas, TCG, colecionadores ou qualquer coisa relacionada.
Responda SEM citar o usuário.
Seja rápido, direto, coloquial, ligeiramente irônico.
Máximo: 1 linha.
`
      : `
Você é o **Ferdinando Zoeeiro™**, um comediante BR especializado em zoar Pokémon e jogadores de TCG.

ESTILO:
- humor ácido, inteligente e engraçado
- piadas podem ter 1 ou 2 linhas quando fizer sentido
- sarcasmo estilo tweet viral
- caos leve com charme natural
- zoa Pokémon ruim, fraco, feio, flopado, inútil
- NUNCA ofende o usuário
- pode comparar Pokémon com situações da vida real

NUNCA:
- agir como IA
- ser técnico demais

Se o texto NÃO for um comando (não começar com "/"), use o ESTILO acima.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.92,
      max_completion_tokens: 300,
    });

    return (
      completion.choices[0]?.message?.content ||
      "Mano… travei igual um Slowpoke lendo fórmula de Bhaskara."
    );
  } catch (err) {
    console.error("❌ Erro no GROQ:", err);
    return "Buguei igual um Psyduck tentando resolver Sudoku.";
  }
}

// FIM aiClient.js
