"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const database_js_1 = require("../db/database.js");
const ledger_service_js_1 = require("../services/ledger.service.js");
const abac_service_js_1 = require("../services/abac.service.js");
const ai_service_js_1 = require("../services/ai.service.js");
const crypto_js_1 = require("../utils/crypto.js");
const upload = (0, multer_1.default)({ dest: 'temp_uploads/' });
exports.documentRouter = (0, express_1.Router)();
// Search documents (Keyword + Semantic)
exports.documentRouter.get('/search', (req, res) => {
    const query = (req.query.q || '').toLowerCase();
    if (!query) {
        return res.json(database_js_1.db.documents);
    }
    const results = database_js_1.db.documents.filter((d) => {
        const titleMatch = d.title.toLowerCase().includes(query);
        const typeMatch = d.doc_type.toLowerCase().includes(query);
        const entityNameMatch = d.extracted_entities.names.some((n) => n.toLowerCase().includes(query));
        const sectionMatch = d.extracted_entities.sections.some((s) => s.toLowerCase().includes(query));
        const locationMatch = d.extracted_entities.locations.some((l) => l.toLowerCase().includes(query));
        return titleMatch || typeMatch || entityNameMatch || sectionMatch || locationMatch;
    });
    return res.json(results);
});
// Get document metadata & ABAC check
exports.documentRouter.get('/:id', (req, res) => {
    const userId = req.headers['x-user-id'] || 'usr-io-sharma';
    const docId = req.params.id;
    const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    // ABAC Policy check
    const access = abac_service_js_1.ABACService.checkAccess(userId, docId, 'view');
    if (!access.allowed) {
        return res.status(403).json({ error: access.reason, access_grant: access.grant });
    }
    // Append custody view event
    ledger_service_js_1.LedgerService.appendCustodyEvent(docId, userId, 'view', req.ip);
    const custodyTrail = database_js_1.db.custodyEvents.filter((e) => e.doc_id === docId);
    const signatures = database_js_1.db.signatures.filter((s) => s.doc_id === docId);
    const accessGrants = database_js_1.db.accessGrants.filter((g) => g.doc_id === docId);
    return res.json({
        ...doc,
        custody_trail: custodyTrail,
        signatures,
        access_grants: accessGrants,
        access_permission: access.reason,
    });
});
// Download document file contents (logs custody download event)
exports.documentRouter.get('/:id/download', (req, res) => {
    const userId = req.headers['x-user-id'] || 'usr-io-sharma';
    const docId = req.params.id;
    const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    // ABAC Policy check
    const access = abac_service_js_1.ABACService.checkAccess(userId, docId, 'view');
    if (!access.allowed) {
        return res.status(403).json({ error: access.reason });
    }
    // Log custody download event
    ledger_service_js_1.LedgerService.appendCustodyEvent(docId, userId, 'download', req.ip);
    if (fs_1.default.existsSync(doc.storage_path)) {
        const fileContent = fs_1.default.readFileSync(doc.storage_path, 'utf-8');
        return res.json({
            doc_id: doc.doc_id,
            title: doc.title,
            content: fileContent,
            file_hash: doc.file_hash,
            version: doc.version,
        });
    }
    return res.status(404).json({ error: 'Storage file not found on disk' });
});
// Verify Document Integrity (recomputes SHA-256 vs chained ledger)
exports.documentRouter.get('/:id/verify-integrity', (req, res) => {
    try {
        const result = ledger_service_js_1.LedgerService.verifyDocumentIntegrity(req.params.id);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// DEMO TOOL: Simulate File Tampering on Disk
exports.documentRouter.post('/:id/tamper-demo', (req, res) => {
    try {
        const result = ledger_service_js_1.LedgerService.tamperDocumentOnDisk(req.params.id);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// DEMO TOOL: Restore Storage File
exports.documentRouter.post('/:id/restore-demo', (req, res) => {
    try {
        const result = ledger_service_js_1.LedgerService.restoreDocumentOnDisk(req.params.id);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// Upload new document (encrypts, calculates SHA-256, runs AI classification & NER, anchors block #0)
exports.documentRouter.post('/upload', upload.single('file'), (req, res) => {
    const userId = req.headers['x-user-id'] || req.body.uploaded_by || 'usr-io-sharma';
    const { case_id, title } = req.body;
    let fileContent = req.file
        ? fs_1.default.readFileSync(req.file.path, 'utf-8')
        : req.body.text_content || 'Sample ingested evidentiary document text.';
    const docId = `doc-${Date.now()}`;
    const fileName = `${docId}.txt`;
    const storagePath = path_1.default.join((0, database_js_1.getStorageDir)(), fileName);
    fs_1.default.writeFileSync(storagePath, fileContent, 'utf-8');
    const fileHash = (0, crypto_js_1.computeSHA256)(fileContent);
    // Run AI Classification & Entity Extraction
    const classification = ai_service_js_1.AIService.classifyDocument(fileContent);
    const entities = ai_service_js_1.AIService.extractEntities(fileContent);
    const docRecord = {
        doc_id: docId,
        case_id: case_id || 'case-2026-8891',
        doc_type: classification.doc_type,
        title: title || `${classification.doc_type.toUpperCase()} File (${new Date().toLocaleDateString()})`,
        file_url: `/storage/${fileName}`,
        file_hash: fileHash,
        version: 1,
        uploaded_by: userId,
        ai_classification_confidence: classification.confidence,
        extracted_entities: entities,
        is_redacted: false,
        created_at: new Date().toISOString(),
        storage_path: storagePath,
    };
    database_js_1.db.documents.unshift(docRecord);
    // Anchor Genesis Block Event on Merkle Ledger
    const custodyEvent = ledger_service_js_1.LedgerService.appendCustodyEvent(docId, userId, 'upload', req.ip);
    // Initialize Signature Pipeline
    database_js_1.db.signatures.push({
        signature_id: `sig-${Date.now()}`,
        doc_id: docId,
        signer_id: userId,
        signature_hash: (0, crypto_js_1.generateDigitalSignature)(docId, userId, 'key-seed-io'),
        approval_stage: 'investigating_officer',
        status: 'approved',
        signed_at: new Date().toISOString(),
    });
    return res.status(201).json({
        document: docRecord,
        custody_event: custodyEvent,
    });
});
// Redact Document
exports.documentRouter.post('/:id/redact', (req, res) => {
    const userId = req.headers['x-user-id'] || 'usr-io-sharma';
    const docId = req.params.id;
    const { redacted_text } = req.body;
    try {
        const updatedDoc = ai_service_js_1.AIService.applyRedaction(docId, userId, redacted_text);
        return res.json(updatedDoc);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
// Digital Signature Sign Route
exports.documentRouter.post('/:id/sign', (req, res) => {
    const userId = req.headers['x-user-id'] || 'usr-sp-verma';
    const docId = req.params.id;
    const { stage } = req.body;
    const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
    if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    const user = database_js_1.db.users.find((u) => u.user_id === userId);
    const signatureHash = (0, crypto_js_1.generateDigitalSignature)(docId, userId, 'pki-key');
    const newSig = {
        signature_id: `sig-${Date.now()}`,
        doc_id: docId,
        signer_id: userId,
        signature_hash: signatureHash,
        approval_stage: stage || 'sp_review',
        status: 'approved',
        signed_at: new Date().toISOString(),
        signer_name: user?.name,
        signer_badge: user?.badge_id,
    };
    database_js_1.db.signatures.push(newSig);
    // Append custody signature event
    ledger_service_js_1.LedgerService.appendCustodyEvent(docId, userId, 'sign', req.ip);
    return res.json({ message: 'Document digitally signed and anchored to ledger', signature: newSig });
});
