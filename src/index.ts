import path from "path";
import inquirer from "inquirer";
import cliProgress from "cli-progress";
import { loadConfig, mkdir } from "./utils/filesystem";
import { searchAnime, getAvailableEpisodes, getM3u8 } from "./utils/anime";
import { convertM3u8ToMp4 } from "./utils/mp4";
import IResult from "./lib/result";

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

  const { quality } = await inquirer.prompt({
    name: "quality",
    message: "Which quality do you want:",
    type: "list",
    choices: ["360", "480", "720", "1080"],
  });

  // Generate Folder
  mkdir(path.join(config.get("outFolder"), anime));

  const episodes = episode.split("-");
  const firstEpisode = Number(episodes[0]);
  const lastEpisode = Number(episodes[1] || episodes[0]);

  // Initialize Progress Bar
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      format:
        "progress [{bar}] {percentage}% | {episodeName} | ETA: {eta}s | {speed} Kb/s | {size}",
    },
    cliProgress.Presets.shades_grey
  );

  // Download Episodes Syncronously
  const functions: Promise<void>[] = [];
  for (let i = firstEpisode; i <= lastEpisode; i++) {
    const episodeName = `${anime}-episode-${i}`;
    const m3u8 = await getM3u8(episodeName);
    functions.push(
      convertM3u8ToMp4(
        m3u8,
        path.join(config.get("outFolder"), anime, `${episodeName}.mp4`),
        quality,
        multibar.create(100, 0, { episodeName, speed: "N/A", size: "0" })
      )
    );
  }
  await Promise.all(functions);

  console.log("Enjoy! :)");

  process.exit();
}

main().catch((e) => {
  console.log(e);
  process.exit();
});
