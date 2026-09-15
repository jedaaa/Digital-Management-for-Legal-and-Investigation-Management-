"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.adminRouter = (0, express_1.Router)();
// 1. Immutable Authentication Ledger
exports.adminRouter.get('/auth-ledger', (req, res) => {
    // Return ledger entries newest first
    return res.json({
        total: database_js_1.db.authLedger.length,
        entries: database_js_1.db.authLedger.slice(0, 100),
    });
});
// 2. Clear / Reset Failed Lockout (Admin Recovery Action)
exports.adminRouter.post('/unlock-account', (req, res) => {
    const { official_id } = req.body;
    const user = database_js_1.db.users.find((u) => u.official_id?.toLowerCase() === official_id?.toLowerCase());
    if (!user) {
        return res.status(404).json({ error: 'Account not found' });
    }
    user.failed_attempts = 0;
    user.locked_until = undefined;
    database_js_1.db.authLedger.unshift({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        official_id: user.official_id,
        name: user.name,
        admin_type: user.admin_type,
        ip: req.ip || '127.0.0.1',
        device_fingerprint: 'admin-override',
        outcome: 'SUCCESS',
        details: `Security lockout manually cleared by System Administrator.`,
    });
    return res.json({ message: `Lockout cleared for ${user.name} (${user.official_id})`, user });
});
// 3. Pure System Health & Telemetry for System Admin (STRICTLY ZERO CASE DATA)
exports.adminRouter.get('/system-health', (req, res) => {
    return res.json({
        status: 'OPTIMAL',
        network: 'NyayaChain Sovereign Judicial Ledger (Mainnet Node 01)',
        uptime_seconds: Math.floor(process.uptime()),
        block_height: 1489204,
        latest_block_hash: '0x8f2d91a...c4391',
        mempool_tx_count: 14,
        consensus_mechanism: 'Proof-of-Authority (PoA / PBFT)',
        active_validator_nodes: 12,
        total_registered_nodes: 12,
        validator_clusters: [
            { node_id: 'val-delhi-highcourt', name: 'Delhi High Court Node', status: 'ONLINE', latency_ms: 12, role: 'Primary Leader' },
            { node_id: 'val-sc-india', name: 'Supreme Court of India Node', status: 'ONLINE', latency_ms: 8, role: 'Validator' },
            { node_id: 'val-tn-madras-hc', name: 'Madras High Court Node', status: 'ONLINE', latency_ms: 24, role: 'Validator' },
            { node_id: 'val-nic-central', name: 'NIC Central HSM Cluster', status: 'ONLINE', latency_ms: 16, role: 'Key Escrow & KMS' },
            { node_id: 'val-cbi-hq', name: 'CBI Headquarters Node', status: 'ONLINE', latency_ms: 19, role: 'Validator' },
            { node_id: 'val-fsl-central', name: 'Directorate of Forensic Sciences Node', status: 'ONLINE', latency_ms: 22, role: 'Validator' },
        ],
        cryptographic_hsm: {
            hardware_status: 'HSM-ACTIVE',
            fips_compliance: 'FIPS 140-3 Level 4 Certified',
            hardware_serial: 'NIT-HSM-2026-X9910',
            active_keys_loaded: 48,
            last_key_rotation: new Date(Date.now() - 86400000 * 18).toISOString(),
            next_scheduled_rotation: new Date(Date.now() + 86400000 * 12).toISOString(),
            signing_latency_us: 140,
        },
        storage_volume: {
            allocated_tb: 50.0,
            used_tb: 14.82,
            encryption_standard: 'AES-256-GCM + Kyber-1024 Post-Quantum Hybrid',
            integrity_violations: 0,
            merkle_root_verified: true,
        },
        threat_intel: {
            active_blocked_ips: 4,
            brute_force_attempts_24h: 3,
            tamper_attempts_detected: 0,
            ddos_mitigation: 'ACTIVE',
        },
        timestamp: new Date().toISOString(),
    });
});
