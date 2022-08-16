"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptEncryptAjaxResponse = exports.generateEncryptAjaxParameters = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const keys = {
    key: crypto_js_1.default.enc.Utf8.parse("37911490979715163134003223491201"),
    second_key: crypto_js_1.default.enc.Utf8.parse("54674138327930866480207815084989"),
    iv: crypto_js_1.default.enc.Utf8.parse("3134003223491201"),
};
/**
 * Parses the embedded video URL to encrypt-ajax.php parameters
 * @param {cheerio} $ Cheerio object of the embedded video page
 * @param {string} id Id of the embedded video URL
 */
async function generateEncryptAjaxParameters($, id) {
    // encrypt the key
    const encrypted_key = crypto_js_1.default.AES["encrypt"](id, keys.key, {
        iv: keys.iv,
    });
    const script = $("script[data-name='episode']").data().value;
    const token = crypto_js_1.default.AES["decrypt"](script, keys.key, {
        iv: keys.iv,
    }).toString(crypto_js_1.default.enc.Utf8);
    return "id=" + encrypted_key + "&alias=" + id + "&" + token;
}
exports.generateEncryptAjaxParameters = generateEncryptAjaxParameters;
/**
 * Decrypts the encrypted-ajax.php response
 * @param {object} obj Response from the server
 */
function decryptEncryptAjaxResponse(obj) {
    const decrypted = crypto_js_1.default.enc.Utf8.stringify(crypto_js_1.default.AES.decrypt(obj.data, keys.second_key, {
        iv: keys.iv,
    }));
    return JSON.parse(decrypted);
}
exports.decryptEncryptAjaxResponse = decryptEncryptAjaxResponse;
