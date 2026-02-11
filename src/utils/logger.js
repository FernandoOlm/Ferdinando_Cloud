// INÍCIO logger.js
import fs from "fs";
import path from "path";


export const botLoggerRegisterEvent_Unique01 = (msg) => {
const base = path.resolve("logs");
if (!fs.existsSync(base)) fs.mkdirSync(base);


const file = `${base}/${new Date().toISOString().slice(0, 10)}.json`;


const entry = {
time: new Date().toISOString(),
from: msg.key.participant || msg.key.remoteJid,
group: msg.key.remoteJid.endsWith("@g.us"),
message: msg.message
};


let logs = [];
if (fs.existsSync(file)) logs = JSON.parse(fs.readFileSync(file));


logs.push(entry);
fs.writeFileSync(file, JSON.stringify(logs, null, 2));
};
// FIM logger.js