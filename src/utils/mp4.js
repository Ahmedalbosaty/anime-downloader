import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath(ffmpegPath.path);

export async function convertM3u8ToMp4(file, output, progressBar) {
  let totalTime;

  return new Promise((resolve, reject) => {
    ffmpeg(file)
      .on("error", (error) => {
        console.log(`An error occurred with ${file}: `, error?.message);
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
        progressBar.update(percent);
      })
      .outputOptions("-c copy")
      .outputOptions("-bsf:a aac_adtstoasc")
      .output(output)
      .run();
  });
}
