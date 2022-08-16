import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { formatBytes } from "./filesystem";
import { SingleBar } from "cli-progress";
ffmpeg.setFfmpegPath(ffmpegPath.path);

type Quality = "360" | "480" | "720" | "1080";
const qualityMap: Record<Quality, number> = {
  "360": 0,
  "480": 1,
  "720": 2,
  "1080": 3,
};

export async function convertM3u8ToMp4(
  files: string[],
  output: string,
  quality: Quality,
  progressBar: SingleBar
) {
  let totalTime: number;

  return new Promise<void>((resolve) => {
    try {
      ffmpeg(files[0])
        .on("error", (error) => {
          console.log(`An error occurred with ${files[0]}: `, error?.message);
          if (files.length > 0) {
            convertM3u8ToMp4(files.slice(1), output, quality, progressBar);
          }
        })
        .on("codecData", (data) => {
          totalTime = parseInt(data.duration.replace(/:/g, ""));
        })
        .on("end", () => {
          resolve();
        })
        .on("progress", (progress) => {
          const time = parseInt(progress.timemark.replace(/:/g, ""));
          const percent = (time / totalTime) * 100;
          const speed = progress.currentKbps * 0.25;
          const size = formatBytes(progress.targetSize * 1000);
          progressBar.update(percent, { speed, size });
        })
        .outputOptions("-c copy")
        .outputOptions("-bsf:a aac_adtstoasc")
        .outputOptions(`-map p:${qualityMap[quality]}`)
        .output(output)
        .run();
    } catch {
      console.log(`An error occurred with ${files[0]}`);
      if (files.length > 0) {
        convertM3u8ToMp4(files.slice(1), output, quality, progressBar);
      }
    }
  });
}
