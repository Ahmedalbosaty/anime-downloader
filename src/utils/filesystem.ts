import fs from "fs";

export function mkdir(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export var config: Map<string, any> = new Map();

export async function loadConfig() {
  try {
    const data = fs.readFileSync("./config.json");
    config = new Map(Object.entries(JSON.parse(data.toString())));
    return config;
  } catch (e) {
    console.log(e);
    console.log("Invalid Configuration File");
    process.exit();
  }
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
