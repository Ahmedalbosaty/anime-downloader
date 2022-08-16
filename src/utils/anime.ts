import axios from "axios";
import cheerio from "cheerio";
import userAgent from "user-agents";
import {
  decryptEncryptAjaxResponse,
  generateEncryptAjaxParameters,
} from "./goload";
import {
  BASE_EPISODE_URL,
  BASE_SEARCH_URL,
  BASE_STREAM_URL,
  BASE_DETAILS_URL,
} from "./constants";
import { checkUrl } from "./network";
import IResult from "../lib/result";

// Get Amount of episodes for an anime
export async function getAvailableEpisodes(anime: string) {
  const res = await axios.get(BASE_DETAILS_URL(anime));
  const $ = cheerio.load(res.data);
  const end = $("#episode_page > li").last().find("a").attr("ep_end");
  return parseInt(end || "0");
}

// Search for Anime using gogoanime
export async function searchAnime(
  search: string,
  page = 0
): Promise<IResult[]> {
  const results: IResult[] = [];

  try {
    const searchPage = await axios.get(BASE_SEARCH_URL(search, page));
    const $ = cheerio.load(searchPage.data);

    $("div.last_episodes > ul > li").each((i, el) => {
      results.push({
        animeId: $(el).find("p.name > a").attr("href")?.split("/")[2]!,
        animeTitle: $(el).find("p.name > a").attr("title")!,
        animeUrl: "/" + $(el).find("p.name > a").attr("href")!,
        animeImg: $(el).find("div > a > img").attr("src")!,
        status: $(el).find("p.released").text().trim(),
      });
    });

    return results;
  } catch (err) {
    return [];
  }
}

// Get Streaming Link for given episode by id or name
export async function getM3u8(id: string): Promise<string | undefined> {
  let sources: any[] = [];
  let sources_bk: any[] = [];
  try {
    let epPage, server, $, serverUrl;

    if (id.includes("episode")) {
      epPage = await axios.get(BASE_EPISODE_URL(id));
      $ = cheerio.load(epPage.data);
      server = $("#load_anime > div > div > iframe").attr("src");
      serverUrl = new URL("https:" + server);
    } else serverUrl = new URL(BASE_STREAM_URL(id));

    const goGoServerPage = await axios.get(serverUrl.href, {
      headers: { "User-Agent": userAgent.toString() },
    });

    const $$ = cheerio.load(goGoServerPage.data);

    const params = await generateEncryptAjaxParameters(
      $$,
      serverUrl.searchParams.get("id")
    );

    const fetchRes = await axios.get(
      `
      ${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`,
      {
        headers: {
          "User-Agent": userAgent.toString(),
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const res: any = decryptEncryptAjaxResponse(fetchRes.data);

    if (!res.source) throw new Error("No sources found!");

    res.source.forEach((source: any) => sources.push(source));
    res.source_bk.forEach((source: any) => sources_bk.push(source));

    sources.filter(async (source) => {
      return await checkUrl(source.file);
    });
    sources_bk.filter(async (source) => {
      return await checkUrl(source.file);
    });

    return sources_bk[0].file || sources[0].file;
  } catch (err) {
    throw new Error(err);
  }
}
