"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.caseRouter = (0, express_1.Router)();
// List cases
exports.caseRouter.get('/', (req, res) => {
    const { station, status } = req.query;
    let cases = database_js_1.db.cases;
    if (station) {
        cases = cases.filter((c) => c.station.toLowerCase().includes(String(station).toLowerCase()));
    }
    if (status) {
        cases = cases.filter((c) => c.status === status);
    }
    return res.json(cases);
});
// Get Live Unified Case Docket
exports.caseRouter.get('/unified-pipeline', (req, res) => {
    const loaded = (0, database_js_1.loadUnifiedCaseFromDisk)();
    return res.json({ docket: loaded });
});
// Update / Persist Live Unified Case Docket
exports.caseRouter.post('/unified-pipeline', (req, res) => {
    const { docket } = req.body;
    if (!docket) {
        return res.status(400).json({ error: 'Docket is required' });
    }
    (0, database_js_1.saveUnifiedCaseToDisk)(docket);
    return res.json({ message: 'Unified case docket persisted to disk', docket });
});
// Purge only cases, documents, evidence, and pipelines (keeps signed-in police users intact)
exports.caseRouter.post('/clear-all', (req, res) => {
    (0, database_js_1.clearAllCasesAndData)();
    return res.json({
        success: true,
        message: 'All dummy cases, documents, and evidentiary pipelines deleted. Ready for fresh test case.',
    });
});
// Complete System Purge (Wipes user data, personnel actions, and dummy cases)
exports.caseRouter.post('/reset-all-system-data', (req, res) => {
    (0, database_js_1.clearAllSystemData)();
    return res.json({
        success: true,
        message: 'All signed-in user data, personnel orders, and dummy cases purged successfully. Ready for fresh test flow.',
    });
});
// Get case by ID
exports.caseRouter.get('/:id', (req, res) => {
    const caseItem = database_js_1.db.cases.find((c) => c.case_id === req.params.id || c.case_number === req.params.id);
    if (!caseItem) {
        return res.status(404).json({ error: 'Case not found' });
    }
    const caseDocs = database_js_1.db.documents.filter((d) => d.case_id === caseItem.case_id);
    return res.json({ ...caseItem, documents: caseDocs });
});
// Create new case
exports.caseRouter.post('/', (req, res) => {
    const { case_number, fir_number, station, assigned_officers, sensitivity_level, title, description } = req.body;
    const newCase = {
        case_id: `case-${Date.now()}`,
        case_number: case_number || `CR-2026-${Math.floor(1000 + Math.random() * 9000)}-ND`,
        fir_number: fir_number || `FIR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'under_investigation',
        station: station || 'Mahila Police Station, Central District',
        assigned_officers: assigned_officers || ['usr-io-sharma'],
        sensitivity_level: sensitivity_level || 'pocso_women_safety',
        created_at: new Date().toISOString(),
        title: title || 'New Legal Investigation Case File',
        description: description || 'Evidentiary investigation initiated.',
    };
    database_js_1.db.cases.unshift(newCase);
    return res.status(201).json(newCase);
});
// Complete System Purge (Wipes user data, personnel actions, and dummy cases)
exports.caseRouter.post('/reset-all-system-data', (req, res) => {
    (0, database_js_1.clearAllSystemData)();
    return res.json({
        success: true,
        message: 'All signed-in user data, personnel orders, and dummy cases purged successfully. Ready for fresh test flow.',
    });
});
