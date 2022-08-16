"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUrl = void 0;
const axios_1 = __importDefault(require("axios"));
async function checkUrl(url) {
    try {
        await axios_1.default.get(url);
        return true;
    }
    catch {
        return false;
    }
}
exports.checkUrl = checkUrl;
