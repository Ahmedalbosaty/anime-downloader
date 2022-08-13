import axios from "axios";

export async function checkUrl(url) {
  try {
    await axios.get(url);
    return true;
  } catch {
    return false;
  }
}
