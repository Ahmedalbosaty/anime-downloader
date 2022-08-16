import fs from "fs";

export function mkdir(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

var config = {};

export async function loadConfig() {
  try {
    if (config) {
      return config;
    }
    const data = fs.readFileSync("./config.json");
    return JSON.parse(data);
  } catch (e) {
    console.log("Invalid File");
    process.exit();
  }
}

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
