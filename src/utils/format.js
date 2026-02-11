// utils/format.js
// INÍCIO format.js

export const cleanText_Unique01 = (text = "") => {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

export const limitText_Unique01 = (text = "", max = 500) => {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
};

export const onlyHumanText_Unique01 = (text = "") => {
  return text
    .replace(/[*_~`]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();
};

// FIM format.js
