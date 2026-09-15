"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSHA256 = computeSHA256;
exports.computeChainedHash = computeChainedHash;
exports.encryptFileBuffer = encryptFileBuffer;
exports.generateDigitalSignature = generateDigitalSignature;
exports.generateTxId = generateTxId;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Computes SHA-256 hash of a string or buffer
 */
function computeSHA256(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Computes SHA-256 hash of a Merkle node / Chained ledger transaction block
 */
function computeChainedHash(prevHash, docId, userId, action, timestamp) {
    const payload = `${prevHash}|${docId}|${userId}|${action}|${timestamp}`;
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
/**
 * Simulates AES-256-GCM file encryption
 */
const ENCRYPTION_KEY = crypto_1.default.scryptSync('nyayachain-master-secret-key', 'salt-sih-26190', 32);
function encryptFileBuffer(buffer) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}
/**
 * Simulates PKI asymmetric signature hash generation
 */
function generateDigitalSignature(docId, userId, privateKeySeed) {
    const timestamp = new Date().toISOString();
    const payload = `SIG:${docId}:${userId}:${timestamp}:${privateKeySeed}`;
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
/**
 * Generates a mock transaction ID for the ledger
 */
function generateTxId() {
    return 'tx_0x' + crypto_1.default.randomBytes(16).toString('hex');
}
