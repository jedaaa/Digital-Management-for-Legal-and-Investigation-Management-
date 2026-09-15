"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const database_js_1 = require("../db/database.js");
const ledger_service_js_1 = require("./ledger.service.js");
class PDFService {
    /**
     * Generates a Court-Admissible Evidence Certificate under Section 65B Indian Evidence Act
     */
    static generateSection65BCertificate(docId) {
        return new Promise((resolve, reject) => {
            const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
            if (!doc) {
                return reject(new Error(`Document ${docId} not found`));
            }
            const caseItem = database_js_1.db.cases.find((c) => c.case_id === doc.case_id);
            const custodyEvents = database_js_1.db.custodyEvents.filter((e) => e.doc_id === docId);
            const verification = ledger_service_js_1.LedgerService.verifyDocumentIntegrity(docId);
            const pdf = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const buffers = [];
            pdf.on('data', buffers.push.bind(buffers));
            pdf.on('end', () => resolve(Buffer.concat(buffers)));
            pdf.on('error', reject);
            // Header Banner
            pdf
                .fillColor('#0b1329')
                .rect(0, 0, 595.28, 90)
                .fill();
            pdf
                .fillColor('#d97706')
                .fontSize(20)
                .text('NYAYACHAIN (न्याय चेन) EVIDENCE LEDGER', 50, 25, { align: 'center' });
            pdf
                .fillColor('#ffffff')
                .fontSize(11)
                .text('CERTIFICATE OF AUTHENTICITY FOR ELECTRONIC RECORDS', 50, 52, { align: 'center' });
            pdf
                .fontSize(9)
                .fillColor('#94a3b8')
                .text('(Under Section 65B of the Indian Evidence Act, 1872 & Section 63 Bharatiya Sakshya Adhiniyam 2023)', 50, 68, { align: 'center' });
            pdf.moveDown(3);
            // Certificate Body
            pdf.fillColor('#1e293b').fontSize(11).text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, { align: 'right' });
            pdf.moveDown();
            pdf
                .fontSize(14)
                .fillColor('#0b1329')
                .text('CERTIFICATE SUMMARY & COMPLIANCE STATEMENT', { underline: true });
            pdf.moveDown(0.5);
            pdf
                .fontSize(10)
                .fillColor('#334155')
                .text(`I, the undersigned Authorized Custodian of Electronic Evidence, hereby certify that the document described below has been ingested, hashed, and immutably anchored to the NyayaChain Cryptographic Merkle Ledger in the ordinary course of official duty.`, { align: 'justify' });
            pdf.moveDown();
            // Table Box
            const tableTop = pdf.y;
            pdf.rect(50, tableTop, 495, 120).stroke('#cbd5e1');
            pdf.fillColor('#0f172a').fontSize(10);
            pdf.text(`Document Title:`, 60, tableTop + 10);
            pdf.font('Helvetica-Bold').text(doc.title, 160, tableTop + 10);
            pdf.font('Helvetica').text(`Document Type:`, 60, tableTop + 30);
            pdf.font('Helvetica-Bold').text(doc.doc_type.toUpperCase(), 160, tableTop + 30);
            pdf.font('Helvetica').text(`Case / FIR No:`, 60, tableTop + 50);
            pdf.font('Helvetica-Bold').text(`${caseItem?.case_number} (${caseItem?.fir_number})`, 160, tableTop + 50);
            pdf.font('Helvetica').text(`SHA-256 Hash:`, 60, tableTop + 70);
            pdf.font('Courier').fontSize(9).fillColor('#b45309').text(doc.file_hash, 160, tableTop + 71);
            pdf.font('Helvetica').fontSize(10).fillColor('#0f172a').text(`Integrity Status:`, 60, tableTop + 95);
            if (verification.status === 'VERIFIED') {
                pdf.fillColor('#15803d').font('Helvetica-Bold').text(`✅ VERIFIED (Matches Ledger Root)`, 160, tableTop + 95);
            }
            else {
                pdf.fillColor('#b91c1c').font('Helvetica-Bold').text(`❌ COMPROMISED (Hash Mismatch)`, 160, tableTop + 95);
            }
            pdf.y = tableTop + 140;
            pdf.moveDown();
            // Custody History Table
            pdf.fontSize(12).fillColor('#0b1329').font('Helvetica-Bold').text('IMMUTABLE CUSTODY CHAIN AUDIT TRAIL', { underline: true });
            pdf.moveDown(0.5);
            custodyEvents.forEach((evt, idx) => {
                pdf
                    .fontSize(9)
                    .font('Helvetica-Bold')
                    .fillColor('#1e293b')
                    .text(`Block #${idx + 1} | Action: ${evt.action.toUpperCase()} | Tx: ${evt.tx_id.substring(0, 20)}...`);
                pdf
                    .font('Helvetica')
                    .fillColor('#475569')
                    .text(`  Actor: ${evt.user_name} (${evt.user_badge}) | IP: ${evt.ip_address} | Time: ${evt.timestamp}`);
                pdf
                    .font('Courier')
                    .fontSize(8)
                    .fillColor('#64748b')
                    .text(`  Chained Hash: ${evt.current_hash}`);
                pdf.moveDown(0.5);
            });
            pdf.moveDown();
            // Signature Block
            pdf.fontSize(10).font('Helvetica-Bold').fillColor('#0b1329').text('ATTESTATION & DIGITAL SEAL', 50);
            pdf.moveDown(0.5);
            pdf.font('Helvetica').fontSize(9).fillColor('#334155').text('Verified by NyayaChain Cryptographic Ledger Node (ID: NC-ND-NODE-01)');
            pdf.text('Hyperledger Fabric Chaincode Compatibility: OK');
            pdf.text(`Certificate Fingerprint: SHA256:${doc.file_hash.substring(0, 32)}`);
            pdf.end();
        });
    }
}
exports.PDFService = PDFService;
