// utils/helpers.js
// INÍCIO helpers.js

import fs from "fs";

export const fileExists_Unique01 = (path) => {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
};

export const loadJSON_Unique01 = (path, fallback = {}) => {
  try {
    if (!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path));
  } catch {
    return fallback;
  }
};

export const saveJSON_Unique01 = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

export const randomItem_Unique01 = (arr = []) =>
  arr[Math.floor(Math.random() * arr.length)];

// FIM helpers.js
