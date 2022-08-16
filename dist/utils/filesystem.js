"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = exports.loadConfig = exports.config = exports.mkdir = void 0;
const fs_1 = __importDefault(require("fs"));
function mkdir(path) {
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.mkdirSync(path, { recursive: true });
    }
}
exports.mkdir = mkdir;
exports.config = new Map();
async function loadConfig() {
    try {
        const data = fs_1.default.readFileSync("./config.json");
        exports.config = new Map(JSON.parse(data.toString()));
        return exports.config;
    }
    catch (e) {
        console.log("Invalid File");
        process.exit();
    }
}
exports.loadConfig = loadConfig;
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
exports.formatBytes = formatBytes;
