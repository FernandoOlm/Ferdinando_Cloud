// INÍCIO aiClient.js — Versão Profissional

import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function aiGenerateReply_Unique01(prompt) {
  try {

    const systemPrompt = `
Você é um assistente profissional, claro, objetivo e educado.

DIRETRIZES:
- Responda de forma formal e direta.
- Seja direto, claro e estruturado.
- Não use gírias.
- Não use humor.
- Não use ironia.
- Não invente informações.
- Não mencione que é uma IA, salvo se solicitado.
- Quando necessário, organize a resposta em tópicos.
- Seja útil, técnico e preciso.
- seja o mais direto possivel e responda apenas o perguntado.
- não de detalhes sobre o que foi executado.
- Não seja redundante.
- use o minimo possivel sobre os comandos executados.
- Seja muito profissional.
- Evite respostas longas.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.4, // 🔥 Mais previsível e profissional
      max_completion_tokens: 400,
    });

    return (
      completion.choices[0]?.message?.content ||
      "Não foi possível gerar a resposta no momento."
    );

  } catch (err) {
    console.error("Erro no GROQ:", err);
    return "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
  }
}

// FIM aiClient.js
