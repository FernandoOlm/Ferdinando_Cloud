// INÍCIO friendManager.js

import fs from "fs";
import path from "path";

const file = path.resolve("src/data/friendState.json");

export function isFriend(jid) {
  if (!fs.existsSync(file)) return false;
  const data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  return data[jid] === true;
}

export function setFriend(jid) {
  let data = {};
  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  }
  data[jid] = true;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function removeFriend(jid) {
  let data = {};
  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  }
  delete data[jid];
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// FIM friendManager.js
