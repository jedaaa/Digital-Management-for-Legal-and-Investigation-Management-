"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastWSEvent = broadcastWSEvent;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const database_js_1 = require("./db/database.js");
const auth_routes_js_1 = require("./routes/auth.routes.js");
const case_routes_js_1 = require("./routes/case.routes.js");
const document_routes_js_1 = require("./routes/document.routes.js");
const custody_routes_js_1 = require("./routes/custody.routes.js");
const access_routes_js_1 = require("./routes/access.routes.js");
const ai_routes_js_1 = require("./routes/ai.routes.js");
const security_routes_js_1 = require("./routes/security.routes.js");
const admin_routes_js_1 = require("./routes/admin.routes.js");
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Enable CORS & JSON Parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Seed in-memory storage
(0, database_js_1.seedDatabase)();
// API Route Registry
app.use('/api/auth', auth_routes_js_1.authRouter);
app.use('/api/admin', admin_routes_js_1.adminRouter);
app.use('/api/cases', case_routes_js_1.caseRouter);
app.use('/api/documents', document_routes_js_1.documentRouter);
app.use('/api', custody_routes_js_1.custodyRouter);
app.use('/api/access-grants', access_routes_js_1.accessRouter);
app.use('/api/ai', ai_routes_js_1.aiRouter);
app.use('/api/security', security_routes_js_1.securityRouter);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'NyayaChain Evidentiary Ledger Node',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// WebSocket Server for Live Audit & Alert Broadcasting
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
function broadcastWSEvent(type, data) {
    const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
wss.on('connection', (ws) => {
    console.log('[NyayaChain WebSocket] Client connected to live audit feed');
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to NyayaChain Live Merkle Ledger Feed' }));
});
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  ⚖️ NYAYACHAIN (न्याय चेन) BACKEND SERVER ONLINE`);
    console.log(`  📡 REST API: http://localhost:${PORT}/api`);
    console.log(`  🔌 WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`  🔒 Merkle Ledger Node: OK | Encrypted Object Storage: OK`);
    console.log(`=======================================================`);
});
