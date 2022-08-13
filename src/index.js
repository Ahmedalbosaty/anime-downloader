import axios from "axios";
import path from "path";
import inquirer from "inquirer";
import cheerio from "cheerio";
import userAgent from "user-agents";
import {
  decryptEncryptAjaxResponse,
  generateEncryptAjaxParameters,
} from "./utils/goload.js";
import {
  BASE_EPISODE_URL,
  BASE_SEARCH_URL,
  BASE_STREAM_URL,
  BASE_DETAILS_URL,
} from "./utils/constants.js";
import { convertM3u8ToMp4 } from "./utils/mp4.js";
import { loadConfig, mkdir } from "./utils/filesystem.js";
import cliProgress from "cli-progress";
import { checkUrl } from "./utils/network.js";

const config = await loadConfig();

const { search } = await inquirer.prompt({
  name: "search",
  message: "Search by name: ",
});

var results = [];
try {
  results = await searchAnime(search);
} catch (e) {
  console.log("An error occurred while fetching search results");
}
const parsedResults = results.map((r) => r.animeId);

const { anime } = await inquirer.prompt({
  name: "anime",
  message: "Which One: ",
  type: "list",
  choices: parsedResults,
});

const end = await getAvailableEpisodes(anime);
const { episode } = await inquirer.prompt({
  name: "episode",
  message: `Please pick your episodes (range: ${1}-${end}):`,
  validate(input) {
    const ok = input.split("-");
    if (ok.length > 2) return "Invalid input";
    for (let i = 0; i < ok.length; i++) {
      if (!Number(ok[i])) return "not a number";
      if (Number(ok[i]) < 1 || Number(ok[i]) > end) return "Out of range";
    }
    if (ok[0] > ok[1]) return "From Small to Big";
    return true;
  },
});

mkdir(path.join(config.outFolder, anime));
const episodes = episode.split("-");

const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    format:
      "progress [{bar}] {percentage}% | {episodeName} | ETA: {eta}s | {value}/{total}",
  },
  cliProgress.Presets.shades_grey
);
const links = [];

for (
  let i = Number(episodes[0]);
  i <= Number(episodes[1] || episodes[0]);
  i++
) {
  const episodeName = `${anime}-episode-${i}`;
  const res = await getMP4(episodeName);
  links.push(
    downloadEpisode(
      res.sources_bk[0].file || res.sources[0].file,
      episodeName,
      multibar.create(100, 0, { episodeName })
    )
  );
}

await Promise.all(links);

function downloadEpisode(link, episodeName, progressBar) {
  return convertM3u8ToMp4(
    link,
    path.join(config.outFolder, anime, `${episodeName}.mp4`),
    progressBar
  );
}

async function getAvailableEpisodes(anime) {
  const res = await axios.get(BASE_DETAILS_URL(anime));
  const $ = cheerio.load(res.data);
  const end = $("#episode_page > li").last().find("a").attr("ep_end");
  return end;
}

async function searchAnime(search, page = 0) {
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

async function getMP4(id) {
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
