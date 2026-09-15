"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const ai_service_js_1 = require("../services/ai.service.js");
const database_js_1 = require("../db/database.js");
exports.aiRouter = (0, express_1.Router)();
// Document Classification
exports.aiRouter.post('/classify', (req, res) => {
    const { text } = req.body;
    const result = ai_service_js_1.AIService.classifyDocument(text || '');
    return res.json(result);
});
// Entity Extraction
exports.aiRouter.post('/extract-entities', (req, res) => {
    const { text } = req.body;
    const entities = ai_service_js_1.AIService.extractEntities(text || '');
    return res.json(entities);
});
// AI Redaction Suggestions
exports.aiRouter.post('/redact-suggest', (req, res) => {
    const { text } = req.body;
    const suggestions = ai_service_js_1.AIService.suggestRedactions(text || '');
    return res.json(suggestions);
});
// RAG Legal Copilot Query
exports.aiRouter.post('/copilot/query', (req, res) => {
    const { case_id, query } = req.body;
    const result = ai_service_js_1.AIService.queryLegalCopilot(case_id || 'case-2026-8891', query || 'What IPC sections are charged?');
    return res.json(result);
});
// Entity Graph Linking
exports.aiRouter.get('/related-documents/:id', (req, res) => {
    const targetDoc = database_js_1.db.documents.find((d) => d.doc_id === req.params.id);
    if (!targetDoc) {
        return res.status(404).json({ error: 'Document not found' });
    }
    const related = database_js_1.db.documents.filter((d) => {
        if (d.doc_id === targetDoc.doc_id)
            return false;
        // Check shared entities
        const sharedNames = d.extracted_entities.names.some((n) => targetDoc.extracted_entities.names.includes(n));
        const sharedSections = d.extracted_entities.sections.some((s) => targetDoc.extracted_entities.sections.includes(s));
        return sharedNames || sharedSections || d.case_id === targetDoc.case_id;
    });
    return res.json({ target: targetDoc, related });
});
