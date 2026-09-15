"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.accessRouter = (0, express_1.Router)();
// Create time-bound access grant (ABAC)
exports.accessRouter.post('/', (req, res) => {
    const grantedBy = req.headers['x-user-id'] || 'usr-judge-deshmukh';
    const { doc_id, granted_to, permission, duration_days } = req.body;
    const user = database_js_1.db.users.find((u) => u.user_id === granted_to);
    const granter = database_js_1.db.users.find((u) => u.user_id === grantedBy);
    const days = duration_days ? parseInt(duration_days, 10) : 14;
    const now = new Date();
    const validUntil = new Date(now.getTime() + days * 86400000);
    const grant = {
        grant_id: `grant-${Date.now()}`,
        doc_id: doc_id || 'doc-fir-8891',
        granted_to: granted_to || 'usr-defense-mehta',
        permission: permission || 'view',
        valid_from: now.toISOString(),
        valid_until: validUntil.toISOString(),
        granted_by: grantedBy,
        user_name: user?.name || 'Defense Counsel',
        granted_by_name: granter?.name || 'Hon. Justice K. R. Deshmukh',
    };
    database_js_1.db.accessGrants.unshift(grant);
    return res.status(201).json(grant);
});
// Revoke access grant
exports.accessRouter.delete('/:id', (req, res) => {
    const idx = database_js_1.db.accessGrants.findIndex((g) => g.grant_id === req.params.id);
    if (idx !== -1) {
        const removed = database_js_1.db.accessGrants.splice(idx, 1)[0];
        return res.json({ message: 'Grant revoked', grant: removed });
    }
    return res.status(404).json({ error: 'Access grant not found' });
});
// List access grants for document
exports.accessRouter.get('/', (req, res) => {
    const docId = req.query.doc_id;
    let grants = database_js_1.db.accessGrants;
    if (docId) {
        grants = grants.filter((g) => g.doc_id === docId);
    }
    return res.json(grants);
});
