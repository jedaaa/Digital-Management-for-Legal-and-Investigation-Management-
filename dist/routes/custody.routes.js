"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.custodyRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
const pdf_service_js_1 = require("../services/pdf.service.js");
exports.custodyRouter = (0, express_1.Router)();
// Get Document Custody Chain Trail
exports.custodyRouter.get('/documents/:id/custody-trail', (req, res) => {
    const docId = req.params.id;
    const trail = database_js_1.db.custodyEvents.filter((e) => e.doc_id === docId);
    return res.json(trail);
});
// Export Section 65B Indian Evidence Act Court-Admissible PDF Certificate
exports.custodyRouter.get('/audit/export/:id', async (req, res) => {
    const docId = req.params.id;
    try {
        const pdfBuffer = await pdf_service_js_1.PDFService.generateSection65BCertificate(docId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Section65B_Evidence_Certificate_${docId}.pdf`);
        return res.send(pdfBuffer);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
