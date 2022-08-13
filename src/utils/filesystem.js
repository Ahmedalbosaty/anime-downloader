import fs from "fs";

export function mkdir(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export async function loadConfig() {
  try {
    const data = fs.readFileSync("./config.json");
    return JSON.parse(data);
  } catch (e) {
    console.log("Invalid File");
    process.exit();
  }
}
