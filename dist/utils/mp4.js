"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertM3u8ToMp4 = void 0;
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const filesystem_1 = require("./filesystem");
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
async function convertM3u8ToMp4(file, output, progressBar) {
    let totalTime;
    return new Promise((resolve) => {
        (0, fluent_ffmpeg_1.default)(file)
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
            const speed = progress.currentKbps * 0.25;
            const size = (0, filesystem_1.formatBytes)(progress.targetSize * 1000);
            progressBar.update(percent, { speed, size });
        })
            .outputOptions("-c copy")
            .outputOptions("-bsf:a aac_adtstoasc")
            .output(output)
            .run();
    });
}
exports.convertM3u8ToMp4 = convertM3u8ToMp4;
