"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = void 0;
const fs_1 = __importDefault(require("fs"));
const database_js_1 = require("../db/database.js");
const crypto_js_1 = require("../utils/crypto.js");
class LedgerService {
    /**
     * Retrieves the latest block hash in the Merkle hash-chain
     */
    static getLatestHash() {
        if (database_js_1.db.custodyEvents.length === 0) {
            return '0000000000000000000000000000000000000000000000000000000000000000';
        }
        return database_js_1.db.custodyEvents[database_js_1.db.custodyEvents.length - 1].current_hash;
    }
    /**
     * Appends an immutable custody event to the ledger chain
     */
    static appendCustodyEvent(docId, userId, action, ipAddress = '127.0.0.1') {
        const user = database_js_1.db.users.find((u) => u.user_id === userId);
        const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
        const prevHash = this.getLatestHash();
        const timestamp = new Date().toISOString();
        const currentHash = (0, crypto_js_1.computeChainedHash)(prevHash, docId, userId, action, timestamp);
        const txId = (0, crypto_js_1.generateTxId)();
        const event = {
            event_id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            doc_id: docId,
            user_id: userId,
            action,
            prev_hash: prevHash,
            current_hash: currentHash,
            tx_id: txId,
            ip_address: ipAddress,
            timestamp,
            user_name: user?.name || 'Unknown User',
            user_badge: user?.badge_id || 'UNKNOWN',
            user_role: user?.role || 'investigating_officer',
        };
        database_js_1.db.custodyEvents.push(event);
        console.log(`[Merkle Ledger] Block #${database_js_1.db.custodyEvents.length} Anchored | Tx: ${txId.substring(0, 16)}... | Action: ${action.toUpperCase()}`);
        return event;
    }
    /**
     * Performs real-time cryptographic verification of stored file on disk vs chained ledger
     */
    static verifyDocumentIntegrity(docId) {
        const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        // 1. Read physical file on disk
        let computedHash = '';
        try {
            if (fs_1.default.existsSync(doc.storage_path)) {
                const fileBuffer = fs_1.default.readFileSync(doc.storage_path);
                computedHash = (0, crypto_js_1.computeSHA256)(fileBuffer);
            }
            else {
                computedHash = 'FILE_NOT_FOUND_ON_DISK';
            }
        }
        catch (err) {
            computedHash = 'READ_ERROR';
        }
        // 2. Check against stored hash & tamper flag
        const storedHash = doc.file_hash;
        const isTampered = doc.is_tampered || computedHash !== storedHash;
        const ledgerHash = this.getLatestHash();
        const status = isTampered ? 'TAMPERED' : 'VERIFIED';
        if (isTampered) {
            // Trigger live security alert
            const existingAlert = database_js_1.db.securityAlerts.find((a) => a.alert_type === 'hash_mismatch' && a.details.doc_id === docId);
            if (!existingAlert) {
                database_js_1.db.securityAlerts.unshift({
                    alert_id: `alt-tamper-${Date.now()}`,
                    user_id: 'SYSTEM',
                    alert_type: 'hash_mismatch',
                    details: {
                        doc_id: docId,
                        title: doc.title,
                        stored_hash: storedHash,
                        computed_hash: computedHash,
                        detected_at: new Date().toISOString(),
                    },
                    severity: 'critical',
                    created_at: new Date().toISOString(),
                    user_badge: 'SEC-GUARDIAN',
                });
            }
        }
        const docCustodyTrail = database_js_1.db.custodyEvents.filter((e) => e.doc_id === docId);
        return {
            doc_id: docId,
            status,
            stored_hash: storedHash,
            computed_hash: computedHash,
            ledger_hash: ledgerHash,
            last_verified_at: new Date().toISOString(),
            custody_chain_length: docCustodyTrail.length,
            details: isTampered
                ? `CRITICAL ALERT: Physical file SHA-256 hash (${computedHash.substring(0, 16)}...) deviates from ledger anchored root (${storedHash.substring(0, 16)}...). File integrity compromised!`
                : `Cryptographic integrity verified. File SHA-256 hash matches the Merkle block ledger root across all ${docCustodyTrail.length} custody events.`,
        };
    }
    /**
     * DEMO TOOL: Direct disk file tampering simulation
     */
    static tamperDocumentOnDisk(docId) {
        const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        doc.is_tampered = true;
        // Mutate actual bytes on disk if file exists
        if (fs_1.default.existsSync(doc.storage_path)) {
            const original = fs_1.default.readFileSync(doc.storage_path, 'utf-8');
            const tamperedContent = original + '\n\n[UNAUTHORIZED DISK TAMPERING INJECTED - CORRUPT EVIDENCE BYTE]';
            fs_1.default.writeFileSync(doc.storage_path, tamperedContent, 'utf-8');
        }
        console.warn(`[DEMO TAMPERING] Storage file for ${docId} corrupted on disk!`);
        return this.verifyDocumentIntegrity(docId);
    }
    /**
     * DEMO TOOL: Restore original file contents
     */
    static restoreDocumentOnDisk(docId) {
        const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        doc.is_tampered = false;
        if (fs_1.default.existsSync(doc.storage_path)) {
            let content = fs_1.default.readFileSync(doc.storage_path, 'utf-8');
            content = content.replace('\n\n[UNAUTHORIZED DISK TAMPERING INJECTED - CORRUPT EVIDENCE BYTE]', '');
            fs_1.default.writeFileSync(doc.storage_path, content, 'utf-8');
            // Recalculate file hash to match
            doc.file_hash = (0, crypto_js_1.computeSHA256)(content);
        }
        console.log(`[DEMO RESTORE] Storage file for ${docId} restored to pristine condition.`);
        return this.verifyDocumentIntegrity(docId);
    }
}
exports.LedgerService = LedgerService;
