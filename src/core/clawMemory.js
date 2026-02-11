// INÍCIO clawMemory.js
import fs from "fs";
import path from "path";

// ====== DIRETÓRIOS ======
const USERS_DIR = path.resolve("src/data/memory/users");
const GROUPS_DIR = path.resolve("src/data/memory/groups");

// =====================================================
// CRIA DIRETÓRIOS SE NÃO EXISTIREM
// =====================================================
export function initMemorySystem() {
  if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });
  if (!fs.existsSync(GROUPS_DIR)) fs.mkdirSync(GROUPS_DIR, { recursive: true });
}

// =====================================================
// ====================== USUÁRIOS ======================
// =====================================================
export function getUserMemory(id) {
  const file = path.join(USERS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function saveUserMemory(id, data) {
  const file = path.join(USERS_DIR, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function updateUserMemory(id, updates) {
  const current = getUserMemory(id);
  const merged = { ...current, ...updates };
  saveUserMemory(id, merged);
  return merged;
}

// =====================================================
// ======================= GRUPOS =======================
// =====================================================
export function getGroupMemory(jid) {
  const file = path.join(GROUPS_DIR, `${jid}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function saveGroupMemory(jid, data) {
  const file = path.join(GROUPS_DIR, `${jid}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function updateGroupMemory(jid, updates) {
  const current = getGroupMemory(jid);
  const merged = { ...current, ...updates };
  saveGroupMemory(jid, merged);
  return merged;
}

// =====================================================
// ======== COMPATIBILIDADE LEGADA (DESATIVADA) =========
// =====================================================
// Essas funções só existem para evitar que módulos antigos QUEBREM.
// Não fazem nada além de manter o bot estável.

export function getMemory_Unique01() {
  return null; // desativado propositalmente
}

export function saveMemory_Unique01() {
  return null; // desativado propositalmente
}

export function updateMemory_Unique01() {
  return null; // desativado propositalmente
}

// FIM clawMemory.js
