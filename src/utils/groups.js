// ===== INICIO: GERENCIADOR DE GRUPOS =====

import fs from "fs";
import path from "path";

const GROUPS_FILE = path.resolve("src/data/groups.json");

// ===== INICIO: CARREGAR =====
function carregarGrupos_Unique01() {
  if (!fs.existsSync(GROUPS_FILE)) return {};
  return JSON.parse(fs.readFileSync(GROUPS_FILE));
}
// ===== FIM =====


// ===== INICIO: SALVAR =====
function salvarGrupos_Unique02(data) {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(data, null, 2));
}
// ===== FIM =====


// ===== INICIO: ATUALIZAR =====
export async function atualizarGrupo_Unique03(sock, groupId) {
  try {
    if (!groupId.endsWith("@g.us")) return;

    const grupos = carregarGrupos_Unique01();

    const metadata = await sock.groupMetadata(groupId);
    const nomeAtual = metadata.subject;

    // se não existe → cria
    if (!grupos[groupId]) {
      grupos[groupId] = {
        id: groupId,
        name: nomeAtual,
        lastUpdate: new Date().toISOString()
      };

      salvarGrupos_Unique02(grupos);
      return;
    }

    // se mudou → atualiza
    if (grupos[groupId].name !== nomeAtual) {
      grupos[groupId].name = nomeAtual;
      grupos[groupId].lastUpdate = new Date().toISOString();

      salvarGrupos_Unique02(grupos);
    }

  } catch (err) {
    console.log("Erro grupo:", err.message);
  }
}
// ===== FIM =====


// ===== FIM: GERENCIADOR DE GRUPOS =====