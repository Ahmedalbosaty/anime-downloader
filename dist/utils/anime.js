"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getM3u8 = exports.searchAnime = exports.getAvailableEpisodes = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const user_agents_1 = __importDefault(require("user-agents"));
const goload_js_1 = require("./goload.js");
const constants_js_1 = require("./constants.js");
const network_js_1 = require("./network.js");
// Get Amount of episodes for an anime
async function getAvailableEpisodes(anime) {
    const res = await axios_1.default.get((0, constants_js_1.BASE_DETAILS_URL)(anime));
    const $ = cheerio_1.default.load(res.data);
    const end = $("#episode_page > li").last().find("a").attr("ep_end");
    return parseInt(end || "0");
}
exports.getAvailableEpisodes = getAvailableEpisodes;
// Search for Anime using gogoanime
async function searchAnime(search, page = 0) {
    const results = [];
    try {
        const searchPage = await axios_1.default.get((0, constants_js_1.BASE_SEARCH_URL)(search, page));
        const $ = cheerio_1.default.load(searchPage.data);
        $("div.last_episodes > ul > li").each((i, el) => {
            results.push({
                animeId: $(el).find("p.name > a").attr("href")?.split("/")[2],
                animeTitle: $(el).find("p.name > a").attr("title"),
                animeUrl: "/" + $(el).find("p.name > a").attr("href"),
                animeImg: $(el).find("div > a > img").attr("src"),
                status: $(el).find("p.released").text().trim(),
            });
        });
        return results;
    }
    catch (err) {
        return [];
    }
}
exports.searchAnime = searchAnime;
// Get Streaming Link for given episode by id or name
async function getM3u8(id) {
    let sources = [];
    let sources_bk = [];
    try {
        let epPage, server, $, serverUrl;
        if (id.includes("episode")) {
            epPage = await axios_1.default.get((0, constants_js_1.BASE_EPISODE_URL)(id));
            $ = cheerio_1.default.load(epPage.data);
            server = $("#load_anime > div > div > iframe").attr("src");
            serverUrl = new URL("https:" + server);
        }
        else
            serverUrl = new URL((0, constants_js_1.BASE_STREAM_URL)(id));
        const goGoServerPage = await axios_1.default.get(serverUrl.href, {
            headers: { "User-Agent": user_agents_1.default.toString() },
        });
        const $$ = cheerio_1.default.load(goGoServerPage.data);
        const params = await (0, goload_js_1.generateEncryptAjaxParameters)($$, serverUrl.searchParams.get("id"));
        const fetchRes = await axios_1.default.get(`
      ${serverUrl.protocol}//${serverUrl.hostname}/encrypt-ajax.php?${params}`, {
            headers: {
                "User-Agent": user_agents_1.default.toString(),
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        const res = (0, goload_js_1.decryptEncryptAjaxResponse)(fetchRes.data);
        if (!res.source)
            return { error: "No sources found!! Try different source." };
        res.source.forEach((source) => sources.push(source));
        res.source_bk.forEach((source) => sources_bk.push(source));
        sources.filter(async (source) => {
            return await (0, network_js_1.checkUrl)(source.file);
        });
        sources_bk.filter(async (source) => {
            return await (0, network_js_1.checkUrl)(source.file);
        });
        return res.sources_bk[0].file || res.sources[0].file;
    }
    catch (err) {
        return { error: err };
    }
}
exports.getM3u8 = getM3u8;
