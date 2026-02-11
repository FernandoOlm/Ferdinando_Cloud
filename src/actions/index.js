// INÍCIO src/actions/index.js

import acaoPreco from "./action.preco.js";
import acaoLembrete from "./action.lembrete.js";
import acao420 from "./action.420.js";
import acaoEnquetes from "./action.enquetes.js";

// lista de ações registradas
export const actionsList = [
  acaoPreco,
  acaoLembrete,
  acao420,
  acaoEnquetes
];

/**
 * Executa ações automáticas baseado no texto.
 */
export async function executarAcoesAutomaticas_Unique01({ sock, from, text, memory }) {
  for (const action of actionsList) {
    try {
      if (action.match(text)) {
        return await action.run({ sock, from, text, memory });
      }
    } catch (e) {
      console.error("Erro ao executar ação:", action.name, e);
    }
  }

  return null; // nenhuma ação bateu
}

// também exporta alias usado pelo clawBrain
export const runAction_Unique01 = executarAcoesAutomaticas_Unique01;

// FIM src/actions/index.js
