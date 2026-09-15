"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.securityRouter = (0, express_1.Router)();
// Get live security alerts
exports.securityRouter.get('/alerts', (req, res) => {
    return res.json(database_js_1.db.securityAlerts);
});
// Report Incident
exports.securityRouter.post('/report-incident', (req, res) => {
    const { alert_type, details, severity } = req.body;
    const newAlert = {
        alert_id: `alt-${Date.now()}`,
        user_id: req.headers['x-user-id'] || 'usr-io-sharma',
        alert_type: alert_type || 'hash_mismatch',
        details: details || {},
        severity: severity || 'high',
        created_at: new Date().toISOString(),
        user_badge: 'DL-POL-9921',
    };
    database_js_1.db.securityAlerts.unshift(newAlert);
    return res.status(201).json(newAlert);
});
