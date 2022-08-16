import axios from "axios";
import cheerio from "cheerio";
import userAgent from "user-agents";
import {
  decryptEncryptAjaxResponse,
  generateEncryptAjaxParameters,
} from "./goload.js";
import {
  BASE_EPISODE_URL,
  BASE_SEARCH_URL,
  BASE_STREAM_URL,
  BASE_DETAILS_URL,
} from "./constants.js";
import { convertM3u8ToMp4 } from "./mp4.js";
import { checkUrl } from "./network.js";

// Use ffmpeg to convert m3u8 to mp4
export function downloadEpisode(link, episodeName, progressBar) {
  return convertM3u8ToMp4(
    link,
    path.join(config.outFolder, anime, `${episodeName}.mp4`),
    progressBar
  );
}

// Get Amount of episodes for an anime
export async function getAvailableEpisodes(anime) {
  const res = await axios.get(BASE_DETAILS_URL(anime));
  const $ = cheerio.load(res.data);
  const end = $("#episode_page > li").last().find("a").attr("ep_end");
  return end;
}

// Search for Anime using gogoanime
export async function searchAnime(search, page = 0) {
  const results = [];

  try {
    const searchPage = await axios.get(BASE_SEARCH_URL(search, page));
    const $ = cheerio.load(searchPage.data);

    $("div.last_episodes > ul > li").each((i, el) => {
      results.push({
        animeId: $(el).find("p.name > a").attr("href").split("/")[2],
        animeTitle: $(el).find("p.name > a").attr("title"),
        animeUrl: "/" + $(el).find("p.name > a").attr("href"),
        animeImg: $(el).find("div > a > img").attr("src"),
        status: $(el).find("p.released").text().trim(),
      });
    });

    return results;
  } catch (err) {
    console.log(err);
  }
}

// Get Streaming Link for given episode by id or name
export async function getM3u8(id) {
  let sources = [];
  let sources_bk = [];
  try {
    let epPage, server, $, serverUrl;

    if (id.includes("episode")) {
      epPage = await axios.get(BASE_EPISODE_URL(id));
      $ = cheerio.load(epPage.data);
      server = $("#load_anime > div > div > iframe").attr("src");
      serverUrl = new URL("https:" + server);
    } else serverUrl = new URL(BASE_STREAM_URL(id));

    const goGoServerPage = await axios.get(serverUrl.href, {
      headers: { "User-Agent": userAgent },
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
          "User-Agent": userAgent,
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    const res = decryptEncryptAjaxResponse(fetchRes.data);

    if (!res.source)
      return { error: "No sources found!! Try different source." };

    res.source.forEach((source) => sources.push(source));
    res.source_bk.forEach((source) => sources_bk.push(source));

    sources.filter(async (source) => {
      return await checkUrl(source.file);
    });
    sources_bk.filter(async (source) => {
      return await checkUrl(source.file);
    });

    return {
      Referer: serverUrl.href,
      sources: sources,
      sources_bk: sources_bk,
    };
  } catch (err) {
    return { error: err };
  }
}
