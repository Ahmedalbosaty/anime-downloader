import path from "path";
import inquirer from "inquirer";
import cliProgress from "cli-progress";
import { loadConfig, mkdir } from "./utils/filesystem";
import { searchAnime, getAvailableEpisodes, getM3u8 } from "./utils/anime";
import { convertM3u8ToMp4 } from "./utils/mp4";
import IResult from "./lib/result";
import { QUALITIES } from "./utils/constants";
import { getM3u8Metadata } from "./utils/network";
import { arraysEqual } from "./utils/misc";

async function main() {
  const config = await loadConfig();

  // Search for anime
  const { search } = await inquirer.prompt({
    name: "search",
    message: "Search by name: ",
  });

  var results: IResult[] = [];
  try {
    results = await searchAnime(search);
  } catch (e) {
    console.log("An error occurred while fetching search results");
  }
  const parsedResults = results.map((r) => r.animeId);

  // Choose Anime
  const { anime } = await inquirer.prompt({
    name: "anime",
    message: "Which One: ",
    type: "list",
    choices: parsedResults,
  });

  const end = await getAvailableEpisodes(anime);

  // Pick Episode(s)
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

  const episodes = episode.split("-");
  const firstEpisode = Number(episodes[0]);
  const lastEpisode = Number(episodes[1] || episodes[0]);

  // Generate Folder
  mkdir(path.join(config.get("outFolder"), anime));

  // Initialize Progress Bar
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      format:
        "progress [{bar}] {percentage}% | {episodeName} | ETA: {eta}s | {speed} Kb/s | {size}",
    },
    cliProgress.Presets.shades_grey
  );

  var previousQualities: string[] = [];

  // Download Episodes Syncronously
  const functions: Promise<void>[] = [];
  for (let i = firstEpisode; i <= lastEpisode; i++) {
    const episodeName = `${anime}-episode-${i}`;
    const m3u8 = await getM3u8(episodeName);
    if (m3u8.length === 0) {
      console.log(`${episodeName} is not available`);
      continue;
    }
    const { segments } = await getM3u8Metadata(m3u8);
    const qualities: string[] = segments.map((s) => s.streamInf.resolution);

    if (arraysEqual(previousQualities, qualities)) {
    } else {
      var { quality } = await inquirer.prompt({
        name: "quality",
        message: `Which quality do you want for episode ${i}:`,
        type: "list",
        choices: qualities,
      });
    }
    previousQualities = [...qualities];
    functions.push(
      convertM3u8ToMp4(
        m3u8,
        path.join(config.get("outFolder"), anime, `${episodeName}.mp4`),
        qualities.findIndex((q) => q === quality),
        multibar.create(100, 0, { episodeName, speed: "N/A", size: "0" })
      )
    );
  }
  await Promise.all(functions);

  console.log("\nEnjoy! :)");

  process.exit();
}

main().catch((e) => {
  console.log(e);
  process.exit();
});
