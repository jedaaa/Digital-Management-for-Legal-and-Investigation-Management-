"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.SAMPLE_DATASETS = void 0;
exports.getStorageDir = getStorageDir;
exports.saveUsersToDisk = saveUsersToDisk;
exports.loadUsersFromDisk = loadUsersFromDisk;
exports.clearAllUsers = clearAllUsers;
exports.clearAllSystemData = clearAllSystemData;
exports.saveUnifiedCaseToDisk = saveUnifiedCaseToDisk;
exports.loadUnifiedCaseFromDisk = loadUnifiedCaseFromDisk;
exports.savePersonnelActionsToDisk = savePersonnelActionsToDisk;
exports.loadPersonnelActionsFromDisk = loadPersonnelActionsFromDisk;
exports.clearAllCasesAndData = clearAllCasesAndData;
exports.seedDatabase = seedDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Storage directories
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data_storage');
const ENCRYPTED_FILES_DIR = path_1.default.join(DATA_DIR, 'encrypted_objects');
const USERS_FILE = path_1.default.join(DATA_DIR, 'signed_in_users.json');
const PERSONNEL_ACTIONS_FILE = path_1.default.join(DATA_DIR, 'personnel_actions.json');
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs_1.default.existsSync(ENCRYPTED_FILES_DIR)) {
    fs_1.default.mkdirSync(ENCRYPTED_FILES_DIR, { recursive: true });
}
// Hardcoded Sample Datasets for Dropdowns
exports.SAMPLE_DATASETS = {
    jurisdiction_nodes: [
        { id: 'node-dgp-tn', name: 'State Police Headquarters, Mylapore, Chennai' },
        { id: 'node-chennai-comm', name: 'Greater Chennai Police Commissionerate, Vepery' },
        { id: 'node-coimbatore-comm', name: 'Coimbatore City Police Commissionerate' },
        { id: 'node-madurai-comm', name: 'Madurai City Police Commissionerate' },
        { id: 'node-erode-ps1', name: 'Police Station 1, Erode Town Sub-Division' },
        { id: 'node-erode-ps2', name: 'Police Station 2, Erode Town Crime & Traffic' },
        { id: 'node-erode-awps', name: 'All-Women Police Station, Erode' },
        { id: 'node-mahila-ps', name: 'Mahila Police Station, Central District' },
        { id: 'node-cyber-cell', name: 'Cyber Crime Cell, South District' },
        { id: 'node-cp-ps', name: 'Connaught Place Police Station, Central District' },
        { id: 'node-dwarka-ps', name: 'Dwarka Sector 23 PS, South-West District' },
    ],
    labs: [
        { id: 'lab-rfsl-erode', name: 'Regional Forensic Science Laboratory, Erode Range' },
        { id: 'lab-fsl-chennai', name: 'Forensic Sciences Department, Mylapore, Chennai' },
        { id: 'lab-cfsl-delhi', name: 'Central Forensic Science Laboratory (CFSL), New Delhi' },
        { id: 'lab-fsl-rohini', name: 'State Forensic Science Laboratory (SFSL), Rohini' },
    ],
    courts: [
        { id: 'court-madras-hc', name: 'High Court of Judicature at Madras, Chennai' },
        { id: 'court-madras-hc-mdu', name: 'Madras High Court - Madurai Bench' },
        { id: 'court-sessions-erode', name: 'Principal District and Sessions Court, Erode' },
        { id: 'court-ftsc-pocso', name: 'Fast Track Special Court (POCSO), Erode' },
        { id: 'court-tis-hazari', name: 'Sessions Court, Tis Hazari Courts Complex' },
        { id: 'court-delhi-hc', name: 'High Court of Delhi, New Delhi' },
    ],
    police_ranks: [
        'Director General of Police (DGP)',
        'Additional Director General of Police (ADGP)',
        'Commissioner of Police (CP)',
        'Inspector General of Police (IGP)',
        'Deputy Inspector General of Police (DIG)',
        'Superintendent of Police (SP)',
        'Deputy Commissioner of Police (DCP)',
        'Deputy Superintendent of Police (DSP)',
        'Assistant Commissioner of Police (ACP)',
        'Inspector of Police (SHO)',
        'Sub-Inspector (SI)',
        'Head Constable (HC)',
        'Police Constable (PC)',
        'Police Constable (Writer)',
    ],
    prosecutor_designations: [
        'Director of Prosecution',
        'Deputy Director of Prosecution',
        'Public Prosecutor (PP)',
        'Additional Public Prosecutor (Addl. PP)',
        'Assistant Public Prosecutor (APP)',
    ],
    judge_levels: [
        'Magistrate Court',
        'Sessions Court / District Court',
        'High Court',
        'Supreme Court',
    ],
    admin_types: [
        'Station Admin',
        'Jurisdiction Admin',
        'Court Admin',
        'Bar Verification Desk',
        'Inter-Agency Admin',
        'System Admin',
    ],
};
// In-Memory DB Stores (Zero hardcoded users: only signed-in users are persisted)
exports.db = {
    users: [],
    cases: [],
    documents: [],
    custodyEvents: [],
    accessGrants: [],
    signatures: [],
    securityAlerts: [],
    authLedger: [],
    personnelActions: [],
};
function getStorageDir() {
    return ENCRYPTED_FILES_DIR;
}
// Persist only signed in users to disk
function saveUsersToDisk() {
    try {
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(exports.db.users, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[DB] Failed to save signed-in users to disk:', err);
    }
}
function loadUsersFromDisk() {
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            const data = fs_1.default.readFileSync(USERS_FILE, 'utf-8');
            exports.db.users = JSON.parse(data) || [];
            console.log(`[DB] Loaded ${exports.db.users.length} authenticated user(s) from persistent disk.`);
        }
        else {
            exports.db.users = [];
        }
    }
    catch (err) {
        console.error('[DB] Error loading users from disk:', err);
        exports.db.users = [];
    }
}
const UNIFIED_CASE_PIPELINE_FILE = path_1.default.join(DATA_DIR, 'unified_case_pipeline.json');
// Clear all users and dummy cases from memory and disk (complete data wipe)
function clearAllUsers() {
    exports.db.users = [];
    try {
        if (fs_1.default.existsSync(USERS_FILE)) {
            fs_1.default.unlinkSync(USERS_FILE);
        }
        console.log('[DB] All user data successfully deleted.');
    }
    catch (err) {
        console.error('[DB] Failed to delete users file:', err);
    }
}
function clearAllSystemData() {
    exports.db.users = [];
    exports.db.personnelActions = [];
    exports.db.cases = [];
    exports.db.documents = [];
    exports.db.custodyEvents = [];
    exports.db.accessGrants = [];
    exports.db.signatures = [];
    exports.db.securityAlerts = [];
    exports.db.authLedger = [];
    try {
        if (fs_1.default.existsSync(USERS_FILE))
            fs_1.default.unlinkSync(USERS_FILE);
        if (fs_1.default.existsSync(PERSONNEL_ACTIONS_FILE))
            fs_1.default.unlinkSync(PERSONNEL_ACTIONS_FILE);
        if (fs_1.default.existsSync(UNIFIED_CASE_PIPELINE_FILE))
            fs_1.default.unlinkSync(UNIFIED_CASE_PIPELINE_FILE);
        console.log('[DB] All user data, personnel orders, and dummy cases purged.');
    }
    catch (err) {
        console.error('[DB] Failed to purge storage files:', err);
    }
}
function saveUnifiedCaseToDisk(caseData) {
    try {
        fs_1.default.writeFileSync(UNIFIED_CASE_PIPELINE_FILE, JSON.stringify(caseData, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[DB] Failed to save unified case to disk:', err);
    }
}
function loadUnifiedCaseFromDisk() {
    try {
        if (fs_1.default.existsSync(UNIFIED_CASE_PIPELINE_FILE)) {
            return JSON.parse(fs_1.default.readFileSync(UNIFIED_CASE_PIPELINE_FILE, 'utf-8'));
        }
    }
    catch (err) {
        console.error('[DB] Error loading unified case from disk:', err);
    }
    return null;
}
// Persist DGP personnel actions (Transfer, Suspend, Dismiss)
function savePersonnelActionsToDisk() {
    try {
        fs_1.default.writeFileSync(PERSONNEL_ACTIONS_FILE, JSON.stringify(exports.db.personnelActions, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[DB] Failed to save personnel actions to disk:', err);
    }
}
function loadPersonnelActionsFromDisk() {
    try {
        if (fs_1.default.existsSync(PERSONNEL_ACTIONS_FILE)) {
            const data = fs_1.default.readFileSync(PERSONNEL_ACTIONS_FILE, 'utf-8');
            exports.db.personnelActions = JSON.parse(data) || [];
        }
        else {
            exports.db.personnelActions = [];
        }
    }
    catch (err) {
        console.error('[DB] Error loading personnel actions:', err);
        exports.db.personnelActions = [];
    }
}
function clearAllCasesAndData() {
    exports.db.cases = [];
    exports.db.documents = [];
    exports.db.custodyEvents = [];
    exports.db.accessGrants = [];
    exports.db.signatures = [];
    exports.db.securityAlerts = [];
    try {
        if (fs_1.default.existsSync(UNIFIED_CASE_PIPELINE_FILE))
            fs_1.default.unlinkSync(UNIFIED_CASE_PIPELINE_FILE);
        if (fs_1.default.existsSync(ENCRYPTED_FILES_DIR)) {
            const files = fs_1.default.readdirSync(ENCRYPTED_FILES_DIR);
            for (const file of files) {
                fs_1.default.unlinkSync(path_1.default.join(ENCRYPTED_FILES_DIR, file));
            }
        }
        console.log('[DB] All cases, documents, evidence, and pipelines cleared successfully.');
    }
    catch (err) {
        console.error('[DB] Failed to clear case storage files:', err);
    }
}
// Database Initialization
function seedDatabase() {
    console.log('[NyayaChain DB] Initializing System Stores...');
    // Legacy users purged. Load ONLY signed-in users from disk.
    loadUsersFromDisk();
    loadPersonnelActionsFromDisk();
    // Fresh state: Zero dummy cases, documents, or fake evidence records
    exports.db.cases = [];
    exports.db.documents = [];
    exports.db.custodyEvents = [];
    exports.db.signatures = [];
    exports.db.accessGrants = [];
    exports.db.securityAlerts = [];
    // 8. Seed Immutable Auth Ledger Entries
    exports.db.authLedger = [
        {
            id: 'led-auth-1001',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            official_id: 'ADM-SUPER-01',
            name: 'Dr. S. K. Verma, IAS',
            ip: '10.20.44.12',
            device_fingerprint: 'dev-demo-trusted',
            outcome: 'SUCCESS',
            admin_type: 'super_admin',
            mfa_method: 'webauthn',
            details: 'FIDO2 WebAuthn biometric verification passed on registered terminal.',
        },
        {
            id: 'led-auth-1002',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            official_id: 'ADM-STATE-TN',
            name: 'Thiru M. Arumugam, IAS',
            ip: '10.28.102.5',
            device_fingerprint: 'dev-demo-trusted',
            outcome: 'SUCCESS',
            admin_type: 'state_admin',
            mfa_method: 'webauthn',
            details: 'Hardware security token signed challenge verified.',
        },
        {
            id: 'led-auth-1003',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            official_id: 'ADM-SYS-CORE',
            name: 'Er. Devashish Roy',
            ip: '10.0.12.90',
            device_fingerprint: 'dev-demo-trusted',
            outcome: 'SUCCESS',
            admin_type: 'system_admin',
            mfa_method: 'totp',
            details: 'Root HSM console session authenticated with TOTP hardware token.',
        },
        {
            id: 'led-auth-1004',
            timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            official_id: 'ADM-UNKNOWN-99',
            ip: '192.168.1.105',
            device_fingerprint: 'fp-untrusted-browser-88x',
            outcome: 'UNRECOGNIZED_ID',
            details: 'Login rejected: Official ID not present in Central Directory.',
        },
        {
            id: 'led-auth-1005',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            official_id: 'ADM-STATION-TOWN1',
            name: 'Inspector V. Balan',
            ip: '10.24.12.8',
            device_fingerprint: 'dev-demo-trusted',
            outcome: 'SUCCESS',
            admin_type: 'station_admin',
            mfa_method: 'totp',
            details: 'Station command access granted via TOTP.',
        },
    ];
    console.log('[NyayaChain DB] Multi-Role Seed data ready! Total Users:', exports.db.users.length, 'Auth Ledger:', exports.db.authLedger.length);
}
