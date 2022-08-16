import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { formatBytes } from "./filesystem";
import { SingleBar } from "cli-progress";
ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function convertM3u8ToMp4(
  files: string[],
  output: string,
  progressBar: SingleBar
) {
  let totalTime: number;
  return new Promise<void>((resolve) => {
    try {
      ffmpeg(files[0])
        .on("error", (error) => {
          console.log(
            `An error occurred with source ${files[0]} outputing to ${output}`
          );
          if (files && files.length > 1) {
            console.log("Retrying with another source...");
            convertM3u8ToMp4(files.slice(1), output, progressBar);
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
        .output(output)
        .run();
    } catch {
      console.log(
        `An error occurred with source ${files[0]} outputing to ${output}`
      );
      if (files && files.length > 1) {
        console.log("Retrying with another source...");
        convertM3u8ToMp4(files.slice(1), output, progressBar);
      }
    }
  });
}
