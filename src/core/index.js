// INÍCIO index.js — versão FINAL com BAN, BV REAL, ALL, AUTORIZAR, IA, MAKECMD
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";

//inicio Importação de comandos
import { clawBrainProcess_Unique01 } from "./clawBrain.js";
import { autorizarUsuario, ensureAuthFile } from "../commands/auth.js";
//import { comandoAll } from "../commands/all.js";
import { addStrike, getStrikes } from "../commands/xerifeStrikes.js";
//import { comandoAjuda } from "../commands/ajuda.js";
//import { comandoCadastroAll } from "../commands/cadastro-all.js";
//import { comandoDesativarLembrete } from "../commands/desativar-lembrete.js";
import { ativarXerife, desativarXerife, xerifeAtivo } from "../commands/xerife.js";
import { registrarLink, linkDuplicado } from "../commands/xerifeRegras.js";
//import { comandoAbrir, comandoFechar } from "../commands/abrir-fechar.js";
//import { comandoSorteio } from "../commands/sorteio.js";
//import { comandoListarMembros } from "../commands/listar-membros.js";
//import { usuarioPodeAnunciar } from "../commands/xerifeRegras.js";


//Final Importação de comandos
// Hash da imagem (novo, sem dependências)
import {
  gerarHashImagem,
  registrarImagem,
  imagemDuplicada
} from "../core/imageHash.js";
import {
  ban,
  unban,
  bansGrupo,
  bansGlobais,
  banCheckEntrada_Unique01,
} from "../commands/ban.js";


// --------------------------------------------------------
// SISTEMA DE BOAS-VINDAS — JSON (VERSÃO ESM CORRIGIDA)
// --------------------------------------------------------



import { fileURLToPath } from "url";

// Criar __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho correto
const bvPath = path.join(__dirname, "../data/bv.json");

// --------------------------------------------------------
// GARANTE QUE O ARQUIVO EXISTE
// --------------------------------------------------------
function ensureBVFile() {
  if (!fs.existsSync(bvPath)) {
    fs.writeFileSync(bvPath, JSON.stringify({ grupos: {} }, null, 2));
  }
}

// --------------------------------------------------------
// CARREGAR
// --------------------------------------------------------
export function loadBV() {
  ensureBVFile();

  console.log("📂 Lendo BV de:", bvPath);

  try {
    const raw = fs.readFileSync(bvPath, "utf8").trim();
    if (!raw) throw new Error("empty");
    return JSON.parse(raw);
  } catch (e) {
    console.log("⚠ bv.json corrompido. Restaurando padrão...");
    const clean = { grupos: {} };
    fs.writeFileSync(bvPath, JSON.stringify(clean, null, 2));
    return clean;
  }
}

// --------------------------------------------------------
// SALVAR
// --------------------------------------------------------
export function saveBV(data) {
  fs.writeFileSync(bvPath, JSON.stringify(data, null, 2));
}

// --------------------------------------------------------
// CRIAR / EDITAR
// --------------------------------------------------------
export function criarBV(grupoId, mensagem) {
  if (!grupoId.endsWith("@g.us")) return false;

  const bv = loadBV();
  bv.grupos[grupoId] = {
    mensagem,
    ativo: true,
    atualizado: new Date().toISOString(),
  };
  saveBV(bv);
  return true;
}

// --------------------------------------------------------
// ATIVAR
// --------------------------------------------------------
export function ativarBV(grupoId) {
  const bv = loadBV();
  if (!bv.grupos[grupoId]) return false;
  bv.grupos[grupoId].ativo = true;
  saveBV(bv);
  return true;
}

// --------------------------------------------------------
// DESATIVAR
// --------------------------------------------------------
export function desativarBV(grupoId) {
  const bv = loadBV();
  if (!bv.grupos[grupoId]) return false;
  bv.grupos[grupoId].ativo = false;
  saveBV(bv);
  return true;
}

// --------------------------------------------------------
// LER
// --------------------------------------------------------
export function lerBV(grupoId) {
  const bv = loadBV();
  return bv.grupos[grupoId] || null;
}


const ROOT = process.env.ROOT_ID;




// LOGGER MUDO
const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  child: () => logger,
};
// CORES
const C = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  white: "\x1b[37m",
  red: "\x1b[31m",
};
ensureAuthFile();
// --------------------------------------------------------
// LOG BONITO
// --------------------------------------------------------
function formatLog(msg, texto, isGroup, groupName, fromClean) {
  const d = new Date();
  const DD = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const YY = String(d.getFullYear()).slice(2);
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const SS = String(d.getSeconds()).padStart(2, "0");
  const stamp = `${C.cyan}| ${DD}.${MM}.${YY} ${HH}:${mm}:${SS} |`;
  const pretty =
    "+55 " +
    fromClean.slice(2, 4) +
    " " +
    fromClean.slice(4, 9) +
    "-" +
    fromClean.slice(9);

  if (isGroup) {
    return (
      stamp +
      C.yellow +
      " GRUPO | " +
      C.magenta +
      `${msg.key.remoteJid} | ` +
      C.green +
      `${groupName} | ${fromClean} | ${pretty} | ${msg.pushName} | ` +
      C.white +
      texto +
      C.reset
    );
  }
  return (
    stamp +
    C.yellow +
    " PV | " +
    C.magenta +
    `${fromClean} | ` +
    C.green +
    `${pretty} | ${msg.pushName} | ` +
    C.white +
    texto +
    C.reset
  );
}



// --------------------------------------------------------
// BOT
// --------------------------------------------------------
import pino from "pino";
// INÍCIO - Verificação de links permitidos e usuários autorizados
const anunciosDB = JSON.parse(
  fs.readFileSync(path.resolve("src/data/anuncios.json"), "utf8")
);
const allowedDB = JSON.parse(
  fs.readFileSync(path.resolve("src/data/auth/allowed.json"), "utf8")
);
// link liberado?
function linkEhLiberado(url) {
  return anunciosDB.some(item => item?.link === url);
}
// FIM - Verificação de links permitidos e usuários autorizados


// INÍCIO - HOT RELOAD comandos.json
function loadComandosJSON() {
  const raw = fs.readFileSync(path.resolve("src/data/comandos.json"), "utf8");
  return JSON.parse(raw);
}
// FIM - HOT RELOAD comandos.json



async function startBot_Unique01() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,

    // 🔥 Logger silencioso (adeus "Closing session")
    logger: pino({ level: "fatal" }),
  });

  globalThis.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "open") {
      console.log(C.green + "🔥 Ferdinando conectado!" + C.reset);
    }

    if (connection === "close") {
      console.log(C.red + "❌ Caiu! Reconectando..." + C.reset);
      setTimeout(() => startBot_Unique01(), 500);
    }
  });

// --------------------------------------------------------
// ENTRADA NO GRUPO (BAN + BV REAL)
// --------------------------------------------------------
sock.ev.on("group-participants.update", async (update) => {
  console.log("🔥 EVENTO DE ENTRADA →", JSON.stringify(update, null, 2));

  // Só processa entradas
  if (update.action !== "add") return;

  const grupoId = update.id;
  const bvConfig = lerBV(grupoId);

  // Se BV não existe ou BV está desativada → apenas ignora
  if (!bvConfig || !bvConfig.ativo) {
    console.log("🚫 BV DESATIVADA ou NÃO CONFIGURADA para:", grupoId);
    return;
  }

  // Loop real dos usuários que entraram
  for (const usuario of update.participants) {
    try {
      const numero = usuario.replace(/@.*/, "");

      // 1) Banimento automático
      const banDetectado = await banCheckEntrada_Unique01(sock, grupoId, usuario);
      if (banDetectado) {
        console.log(`⛔ Usuário banido bloqueado: ${numero}`);
        continue;
      }

      // 2) BOAS-VINDAS (mensagem 1)
      await sock.sendMessage(grupoId, {
        text: `👋 Olá @${numero}!`,
        mentions: [usuario],
      });

      // micro-delay pra evitar flood
      await new Promise((r) => setTimeout(r, 300));

      // 3) Mensagem configurada de BV (mensagem 2)
      await sock.sendMessage(grupoId, {
        text: bvConfig.mensagem,
        mentions: [usuario],
      });

      console.log(`✨ BV enviada com sucesso para ${numero}`);

    } catch (e) {
      console.log("❌ Erro ao enviar BV:", e);
    }
  }
});


  // --------------------------------------------------------
  // MENSAGENS
  // --------------------------------------------------------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;
    if (msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "[Mídia]";

    const raw = msg.key.participant || msg.key.remoteJid;
    let fromClean = raw.replace(/@.*/, "");

    let groupName = "";
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(jid);
        groupName = meta.subject;
      } catch {
        groupName = "Grupo";
      }
    }
    console.log(formatLog(msg, texto, isGroup, groupName, fromClean));
    const BOT_ID = "63755148890155";
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const repliedToBot =
      ctx?.participant === `${BOT_ID}@s.whatsapp.net` ||
      ctx?.participant === `${BOT_ID}@lid`;
    const marcouID = texto.includes(`@${BOT_ID}`);

// ==========================
// XERIFE → MONITORAMENTO
// ==========================

console.log("=================================");
console.log("🚨 XERIFE CHECK");
console.log("isGroup:", isGroup);
console.log("jid:", jid);
console.log("fromClean:", fromClean);
console.log("xerifeAtivo:", xerifeAtivo(jid));
console.log("=================================");

if (isGroup && xerifeAtivo(jid)) {

  console.log("✅ ENTROU NO BLOCO DO XERIFE");

  const meta = await sock.groupMetadata(jid);

  const isAuthorAdmin = meta.participants.some(
    p =>
      p.id.replace(/@.*/, "") === fromClean &&
      (p.admin === "admin" || p.admin === "superadmin")
  );

  const isRoot = fromClean === ROOT;

  console.log("👮 isAuthorAdmin:", isAuthorAdmin);
  console.log("👑 isRoot:", isRoot);

  const textoSeguro =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  console.log("📝 Texto capturado:", textoSeguro);

  // ==========================
  // LINKS
  // ==========================

  const linksEncontrados = textoSeguro.match(/https?:\/\/[^\s]+/gi);

  console.log("🔗 Links encontrados:", linksEncontrados);

  if (linksEncontrados) {
    for (const url of linksEncontrados) {

      console.log("🔎 Verificando URL:", url);

      const duplicado = linkDuplicado(jid, url);
      console.log("📌 Resultado linkDuplicado:", duplicado);

if (duplicado) {
  console.log("🚨 LINK DUPLICADO DETECTADO");

  if (!isAuthorAdmin && !isRoot) {

    const strikes = addStrike(jid, fromClean);
    console.log("🔥 Strike aplicado:", strikes);

    // DELETE SEGURO
    try {
      await sock.sendMessage(jid, {
        delete: {
          remoteJid: jid,
          fromMe: false,
          id: msg.key.id,
          participant: msg.key.participant
        }
      });
    } catch (e) {
      console.log("⚠️ Erro ao deletar (ignorando):", e.message);
    }

    // RESPOSTA SEM FALHA
    let resposta = "";

    if (strikes === 1) {
      resposta = "⚠️ Guerreiro… não repete link. Manda outro.";
    } else if (strikes === 2) {
      resposta = "🚫 Segunda repetição… tá pedindo pra arrumar confusão?";
    } else if (strikes >= 3) {
      resposta = "🚨 Terceira repetição… chamando o admin!";
    }

    if (resposta) {
      await sock.sendMessage(jid, { text: resposta });
    }
  }

  return;
}

      console.log("🆕 Registrando link novo...");
      registrarLink(jid, url);
    }
  }

  // ==========================
  // IMAGENS
  // ==========================

  if (msg.message?.imageMessage) {

    console.log("🖼️ Imagem detectada");

    const buffer = await downloadMediaMessage(msg, "buffer", {});
    const hash = gerarHashImagem(buffer);

    console.log("🔐 Hash:", hash);

    const imgDuplicada = imagemDuplicada(jid, hash);
    console.log("📌 Resultado imagemDuplicada:", imgDuplicada);

    if (imgDuplicada) {
      console.log("🚨 IMAGEM DUPLICADA DETECTADA");

      if (!isAuthorAdmin && !isRoot) {
        const strikes = addStrike(jid, fromClean);
        console.log("🔥 Strikes agora:", strikes);

        await sock.sendMessage(jid, { delete: msg.key });
      }

      return;
    }

    console.log("🆕 Registrando imagem nova...");
    registrarImagem(jid, hash);
    return;
  }
}




// ===========================
// HOT IMPORT PARA COMANDOS
// ===========================
async function hotImport(caminho) {
  return await import(caminho + `?v=${Date.now()}`);
}
// DISPATCH UNIVERSAL DE JSON (!comandos)
// ================================================
if (texto.startsWith("!")) {

  // 🔥 HOT-RELOAD DO comandos.json
function loadComandosJSON() {
  const raw = fs.readFileSync(path.resolve("src/data/comandos.json"), "utf8");
  return JSON.parse(raw);
}

  const comandosJSON = loadComandosJSON();  // <-- AGORA ATUALIZA NA HORA
  const cmd = texto.split(" ")[0];

  // =======================================
  // NORMALIZAR O ID DO PARTICIPANTE
  // =======================================
  // INÍCIO normalizarUserIdFerdinando
  function normalizarUserIdFerdinando(raw) {
    if (!raw) return "";
    let digits = raw.replace(/\D/g, "");
    if (digits.length > 15) {
      digits = digits.slice(-15);
    }
    return digits;
  }
  // FIM normalizarUserIdFerdinando

  const participanteRaw =
    msg.key.participant || msg.participant || msg.key.remoteJid;

  const participanteClean = normalizarUserIdFerdinando(participanteRaw);

  // 🔥 Usar o ID LIMPO no sistema inteiro
  fromClean = participanteClean;
  msg.key.participant = participanteClean;


  // LISTA DE COMANDOS SEM IA
  const comandosSemIA_JSON = [
    "!bans",
    "!globalbans",
    "!unban",
    "!all",
    //"!lembrete",
    "!sorteio",
    "!cadastro-all",
    "!ativar-xerife",
    "!desativar-xerife",
    "!ajuda"
  ];

  // ============================================================
  // 🔥 COMANDOS SEM IA
  // ============================================================
  if (comandosSemIA_JSON.includes(cmd)) {
    const cfg = comandosJSON[cmd];
    if (!cfg) return;

    // checar admin
    const meta = await sock.groupMetadata(jid);
    const isAdmin = meta.participants.some(
      p =>
        p.admin &&
        p.id.replace(/@.*/, "") === fromClean
    );

    console.log("[ADMIN CHECK]", {
      cmd,
      jid,
      fromClean,
      isAdmin
    });


    // ============================
    // VALIDAÇÃO UNIVERSAL DE PERMISSÃO
    // ============================
    const AUTH_PATH = path.resolve("src/data/auth/allowed.json");


    function loadAuth() {
      return JSON.parse(fs.readFileSync(AUTH_PATH, "utf8"));
    }

    const authDB = loadAuth();
    const grupoConfig = authDB.grupos[jid];
    const isAutorizado = grupoConfig?.autorizados?.includes(fromClean);

    console.log("[PERMISSÃO]", {
      cmd,
      jid,
      fromClean,
      isAdmin,
      isAutorizado,
      root: ROOT
    });

    // SE o comando exigir permissão (admin:true no comandos.json)…
    if (cfg.admin) {
      if (!isAdmin && !isAutorizado && fromClean !== ROOT) {
        await sock.sendMessage(jid, { text: "Sem permissão." });
        return;
      }
    }

    // import quente
    const modulo = await hotImport(cfg.file);
    const fn = modulo[cfg.function];

    // args
    const args = texto.split(" ").slice(1);

    let dados;
    try {
      const aridade = fn.length;

      if (aridade === 2) {
        dados = await fn(msg, sock);
      } else if (aridade === 3) {
        dados = await fn(msg, sock, fromClean);
      } else if (aridade === 4) {
        dados = await fn(msg, sock, fromClean, args);
      } else {
        dados = await fn(msg, sock, fromClean, args);
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: "Erro ao executar comando." });
      console.log("Erro comando sem IA:", cmd, e);
      return;
    }

    // envio bruto
    if (typeof dados === "string") {
      await sock.sendMessage(jid, { text: dados });
      return;
    }

    if (dados?.mensagem) {
      await sock.sendMessage(jid, { text: dados.mensagem });
      return;
    }

    if (dados?.texto) {
      await sock.sendMessage(jid, { text: dados.texto });
      return;
    }

    return;
  }

  // ============================================================
  // 🔥 COMANDOS COM IA
  // ============================================================
  if (comandosJSON[cmd]) {
    const cfg = comandosJSON[cmd];

    const meta = await sock.groupMetadata(jid);
    const isAdmin = meta.participants.some(
      p =>
        p.id.replace(/@.*/, "") === fromClean &&
        (p.admin === "admin" || p.admin === "superadmin")
    );

    if (cfg.admin && !isAdmin && fromClean !== ROOT) {
      const resposta = await clawBrainProcess_Unique01({
        tipo: "comando",
        comando: cmd.replace("!", ""),
        dados: { mensagem: "Sem permissão." }
      });

      await sock.sendMessage(jid, { text: resposta });
      return;
    }

    // import quente
    const modulo = await hotImport(cfg.file);
    const fn = modulo[cfg.function];
    const args = texto.split(" ").slice(1);

    let dados;
    try {
      const aridade = fn.length;

      if (aridade === 2) {
        dados = await fn(msg, sock);
      } else if (aridade === 3) {
        dados = await fn(msg, sock, fromClean);
      } else if (aridade === 4) {
        dados = await fn(msg, sock, fromClean, args);
      } else {
        dados = await fn(msg, sock, fromClean, args);
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: "Erro ao executar comando." });
      console.log("Erro comando IA:", cmd, e);
      return;
    }

    const resposta = await clawBrainProcess_Unique01({
      tipo: "comando",
      comando: cmd.replace("!", ""),
      dados
    });

    await sock.sendMessage(jid, { text: resposta });
    return;
  }
}

// =====================================================
// RESPOSTA DIRETA — comandos sem IA
// =====================================================
if (/^[\/\\]/.test(texto)) {
  let retornoCmd = null;
  const clean = texto.split(" ")[0].toLowerCase();
const comandosSemIA = [
  "/all", "/unban", "/bans", "/globalbans", "/listar-membros",
  "!all", "!unban","!ajuda" ,"!bans", "!globalbans", "!listar-membros"
];

if (comandosSemIA.includes(clean) || comandosSemIA.includes(cmd)) {

  // se a função retornou mensagem formatada
  const textoFinal =
    retornoCmd?.mensagem ||
    retornoCmd?.texto ||
    retornoCmd?.anuncioIA ||
    retornoCmd?.despedida ||
    JSON.stringify(retornoCmd, null, 2);

  // ENVIA DO JEITO BRUTO, SEM IA, SEM MEXER
  await sock.sendMessage(jid, { text: textoFinal });

  return;
}


// --------------------------------------------------------
// RESPOSTA IA PARA COMANDOS
// --------------------------------------------------------
const respostaIA = await clawBrainProcess_Unique01({
  tipo: "comando",
  comando: texto,
  grupo: groupName,
  dados: retornoCmd,
});

// 2 mensagens (ban)
if (respostaIA?.anuncioIA) {
  await sock.sendMessage(jid, { text: respostaIA.anuncioIA });
}
if (respostaIA?.despedida) {
  await sock.sendMessage(jid, { text: respostaIA.despedida });
}

// resposta única
if (typeof respostaIA === "string") {
  await sock.sendMessage(jid, { text: respostaIA });
}

return;
}

// --------------------------------------------------------
// IA NORMAL → só responde se marcado ou reply no bot
// --------------------------------------------------------
//if (isGroup && !marcouID && !repliedToBot) return;

const resposta = await clawBrainProcess_Unique01(msg);
//if (resposta) {
//  await sock.sendMessage(jid, { text: String(resposta) });
//}
});
}

startBot_Unique01();

// ========================================================
// SISTEMA DE AÇÕES E LEMBRETES (UNIFICADO)
// ========================================================

import { enviar_lembrete } from "../commands/enviar-lembrete.js";


// Caminhos fixos
const ACTION_PATH = path.resolve("src/data/schedule_action.json");
const CONFIG_PATH = path.resolve("src/data/actions.json");
const REM_PATH = path.resolve("src/data/reminders.json");

setInterval(async () => {
  try {
    const agora = new Date();

    // ========================================================
    // 1) VERIFICA E DISPARA LEMBRETES
    // ========================================================
    if (fs.existsSync(REM_PATH)) {
      const dbRem = JSON.parse(fs.readFileSync(REM_PATH, "utf8"));

      const lembretesAGATILHAR = dbRem.lembretes.filter(
        l => new Date(l.quando) <= agora
      );

      for (const lembrete of lembretesAGATILHAR) {
        console.log(`🔔 Lembrete enviado (${lembrete.tipo}): ${lembrete.mensagem}`);
        await enviar_lembrete(lembrete, globalThis.sock);
      }
    }

    // ========================================================
    // 2) VERIFICA E EXECUTA AÇÃO AGENDADA (ABRIR/FECHAR)
    // ========================================================
    if (!fs.existsSync(ACTION_PATH)) return;

    const actionDB = JSON.parse(fs.readFileSync(ACTION_PATH, "utf8"));
    if (!actionDB.acao) return;

    const acao = actionDB.acao;
    if (acao.aconteceu) return;

    if (!acao.data || !acao.hora) return;

    const horarioAcao = new Date(`${acao.data}T${acao.hora}:00`);
    if (agora < horarioAcao) return;

    // actions.json
    const config = fs.existsSync(CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"))
      : {};

    const comandoConfig = config[acao.comando] || null;
    const relativeFile = comandoConfig?.file || acao.file;
    const fnName = comandoConfig?.function || acao.function;

    const fileAbsPath = new URL(relativeFile, import.meta.url).pathname;

    const modulo = await import(fileAbsPath + `?v=${Date.now()}`);
    const fn = modulo[fnName];
    if (typeof fn !== "function") return;

    await fn(
      { key: { remoteJid: acao.grupo }, message: {} },
      globalThis.sock
    );

    console.log(`⚡ Ação executada: ${acao.comando} no grupo ${acao.grupo}`);

    acao.aconteceu = true;
    fs.writeFileSync(ACTION_PATH, JSON.stringify(actionDB, null, 2));

  } catch (e) {
    console.log("❌ ERRO:", e);
  }
}, 5000);



// FIM index.js

