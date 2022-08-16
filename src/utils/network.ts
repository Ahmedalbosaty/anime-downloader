import axios from "axios";
const M3U8FileParser = require("m3u8-file-parser");

const reader = new M3U8FileParser();

export async function checkUrl(url: string) {
  try {
    await axios.get(url);
    return true;
  } catch {
    return false;
  }
}

export async function getM3u8Metadata(url: string[]) {
  var counter = 0;
  while (true) {
    try {
      const res = await axios.get(url[counter]);
      reader.read(res.data);
      const data = reader.getResult();
      reader.reset();
      return data;
    } catch {
      counter++;
      if (counter >= url.length) return { segments: [] };
    }
  }
}
