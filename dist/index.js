"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const filesystem_1 = require("./utils/filesystem");
const anime_1 = require("./utils/anime");
const mp4_1 = require("./utils/mp4");
async function main() {
    const config = await (0, filesystem_1.loadConfig)();
    // Search for anime
    const { search } = await inquirer_1.default.prompt({
        name: "search",
        message: "Search by name: ",
    });
    var results = [];
    try {
        results = await (0, anime_1.searchAnime)(search);
    }
    catch (e) {
        console.log("An error occurred while fetching search results");
    }
    const parsedResults = results.map((r) => r.animeId);
    // Choose Anime
    const { anime } = await inquirer_1.default.prompt({
        name: "anime",
        message: "Which One: ",
        type: "list",
        choices: parsedResults,
    });
    const end = await (0, anime_1.getAvailableEpisodes)(anime);
    // Pick Episode(s)
    const { episode } = await inquirer_1.default.prompt({
        name: "episode",
        message: `Please pick your episodes (range: ${1}-${end}):`,
        validate(input) {
            const ok = input.split("-");
            if (ok.length > 2)
                return "Invalid input";
            for (let i = 0; i < ok.length; i++) {
                if (!Number(ok[i]))
                    return "not a number";
                if (Number(ok[i]) < 1 || Number(ok[i]) > end)
                    return "Out of range";
            }
            if (ok[0] > ok[1])
                return "From Small to Big";
            return true;
        },
    });
    // Generate Folder
    (0, filesystem_1.mkdir)(path_1.default.join(config.get("outFolder"), anime));
    const episodes = episode.split("-");
    const firstEpisode = Number(episodes[0]);
    const lastEpisode = Number(episodes[1] || episodes[0]);
    // Initialize Progress Bar
    const multibar = new cli_progress_1.default.MultiBar({
        clearOnComplete: false,
        format: "progress [{bar}] {percentage}% | {episodeName} | ETA: {eta}s | {speed} Kb/s | {size}",
    }, cli_progress_1.default.Presets.shades_grey);
    // Download Episodes Syncronously
    const functions = [];
    for (let i = firstEpisode; i <= lastEpisode; i++) {
        const episodeName = `${anime}-episode-${i}`;
        const m3u8 = await (0, anime_1.getM3u8)(episodeName);
        functions.push((0, mp4_1.convertM3u8ToMp4)(m3u8, path_1.default.join(config.get("outFolder"), anime, `${episodeName}.mp4`), multibar.create(100, 0, { episodeName, speed: "N/A", size: "0" })));
    }
    await Promise.all(functions);
    console.log("Enjoy! :)");
    process.exit();
}
main().catch(() => {
    process.exit();
});
