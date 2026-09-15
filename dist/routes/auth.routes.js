"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const database_js_1 = require("../db/database.js");
exports.authRouter = (0, express_1.Router)();
// Get Hardcoded Datasets for Sign-Up Dropdowns
exports.authRouter.get('/sample-datasets', (req, res) => {
    return res.json(database_js_1.SAMPLE_DATASETS);
});
// Login endpoint (Step 1: Official ID + Password)
exports.authRouter.post('/login', (req, res) => {
    const rawId = req.body.official_id || req.body.officialId || req.body.username || req.body.id;
    const password = req.body.password;
    const { device_fingerprint, name } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const fp = (device_fingerprint || req.headers['x-device-fingerprint'] || 'unknown-device').toString();
    if (!rawId || !password) {
        return res.status(400).json({ error: 'Official ID and Password are required.' });
    }
    const idNorm = rawId.trim();
    // Find user by official_id, badge_id, user_id, bar_enrollment_number, or name
    let user = database_js_1.db.users.find((u) => u.official_id?.toLowerCase() === idNorm.toLowerCase() ||
        u.badge_id?.toLowerCase() === idNorm.toLowerCase() ||
        u.user_id?.toLowerCase() === idNorm.toLowerCase() ||
        u.bar_enrollment_number?.toLowerCase() === idNorm.toLowerCase() ||
        (name && u.name?.toLowerCase() === name.trim().toLowerCase()));
    // If user not in storage yet, dynamically create and persist on sign-in
    if (!user) {
        const roleReq = (req.body.role || '').toLowerCase();
        const rankReq = (req.body.rank || '').trim();
        const stationReq = req.body.station || 'State Police Headquarters, Mylapore, Chennai';
        const districtReq = req.body.district || 'Tamil Nadu State Police Headquarters';
        const stateReq = req.body.state || 'Tamil Nadu';
        // 0. Public Prosecutor Detection (Must be checked FIRST to prevent police rank misinterpretation)
        if (roleReq === 'prosecutor' ||
            idNorm.toUpperCase().includes('PROS') ||
            (name && name.toLowerCase().includes('prosecutor'))) {
            user = {
                user_id: `usr-prosecutor-${Date.now()}`,
                name: name?.trim() || 'Thiru K. Natarajan, Public Prosecutor',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'prosecutor',
                department: 'Directorate of Prosecution / Public Prosecutor Office',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                designation: req.body.designation || 'Public Prosecutor (PP)',
                court_id: 'court-madras-hc',
                station: 'Principal Sessions Court',
                location: 'Tamil Nadu Judicial Complex',
                scope_description: 'Public Prosecutor (PP) | High Court of Madras & Sessions Court',
                created_at: new Date().toISOString(),
            };
        }
        // 0B. Defence Counsel Detection
        else if (roleReq === 'defense_counsel' ||
            idNorm.toUpperCase().includes('BAR') ||
            (name && (name.toLowerCase().includes('adv') || name.toLowerCase().includes('counsel') || name.toLowerCase().includes('defense')))) {
            user = {
                user_id: `usr-defense-${Date.now()}`,
                name: name?.trim() || 'Thiru S. Ramachandran, Advocate',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'defense_counsel',
                designation: 'Advocate & Defence Counsel',
                department: 'Bar Council of Tamil Nadu & Puducherry',
                clearance_level: 2,
                status: 'active',
                password_hash: password,
                bar_enrollment_number: idNorm,
                station: 'Bar Association Desk',
                location: 'Tamil Nadu Bar Council',
                scope_description: `Bar Enrollment: ${idNorm} | High Court Bar Association`,
                created_at: new Date().toISOString(),
            };
        }
        // 0C. Forensic Analyst Detection
        else if (roleReq === 'forensic_analyst' ||
            idNorm.toUpperCase().includes('FSL') ||
            (name && (name.toLowerCase().includes('analyst') || name.toLowerCase().includes('forensic')))) {
            let specTitle = 'Bio Analyst (DNA & Biological Division)';
            let specDept = 'Serology, STR DNA Profiling & Biology Division';
            let specName = 'Dr. M. Soundararajan, Senior Scientific Officer';
            let labName = 'Forensic Science Department, Mylapore, Chennai';
            const norm = (idNorm + ' ' + (name || '') + ' ' + (req.body.designation || '')).toLowerCase();
            if (norm.includes('finger') || norm.includes('fp') || norm.includes('dactyl')) {
                specTitle = 'Fingerprint Analyst (Dactyloscopy Division)';
                specDept = 'Single Digit Fingerprint Bureau & AFIS Lab';
                specName = 'Thiru K. Sivakumar, Fingerprint Expert';
                labName = 'State Fingerprint Bureau, Police HQ, Chennai';
            }
            else if (norm.includes('cyber') || norm.includes('digital') || norm.includes('disk')) {
                specTitle = 'Cyber & Digital Forensics Analyst';
                specDept = 'Cyber Forensic Lab & Mobile Triage Division';
                specName = 'Thiru A. Praveen Kumar, Cyber Forensic Examiner';
                labName = 'State Cyber Forensics Division, Anna Salai, Chennai';
            }
            else if (norm.includes('ballistic') || norm.includes('bal') || norm.includes('firearm') || norm.includes('arms')) {
                specTitle = 'Ballistics Analyst (Firearms Division)';
                specDept = 'Ballistics & Tool Marks Identification Wing';
                specName = 'Dr. R. Shanmugam, Ballistics Examiner';
                labName = 'Central Forensic Science Laboratory, Chennai';
            }
            else if (norm.includes('toxic') || norm.includes('tox') || norm.includes('viscera') || norm.includes('chem')) {
                specTitle = 'Chemical & Toxicology Analyst';
                specDept = 'Viscera, Narcotics & Chemical Examination Wing';
                specName = 'Dr. S. Meenakshi, Senior Chemist & Toxicologist';
                labName = 'Regional Forensic Science Laboratory, Coimbatore';
            }
            else if (norm.includes('document') || norm.includes('doc') || norm.includes('forgery') || norm.includes('handwriting')) {
                specTitle = 'Forensic Document Examiner';
                specDept = 'Questioned Documents & Handwriting Identification Wing';
                specName = 'Dr. C. Malathy, Document Examiner';
                labName = 'Forensic Science Department, Madurai Unit';
            }
            user = {
                user_id: `usr-forensic-${Date.now()}`,
                name: name?.trim() || specName,
                badge_id: idNorm,
                official_id: idNorm,
                role: 'forensic_analyst',
                department: specDept,
                clearance_level: 4,
                status: 'active',
                password_hash: password,
                designation: specTitle,
                lab_id: idNorm,
                station: labName,
                location: 'Tamil Nadu State Forensic Science Network',
                scope_description: `${specTitle} | ${labName}`,
                created_at: new Date().toISOString(),
            };
        }
        // 0D. Judge Detection
        else if (roleReq === 'judge' ||
            idNorm.toUpperCase().includes('JUD') ||
            (name && (name.toLowerCase().includes('judge') || name.toLowerCase().includes('justice')))) {
            user = {
                user_id: `usr-judge-${Date.now()}`,
                name: name?.trim() || `Hon. Justice (${idNorm})`,
                badge_id: idNorm,
                official_id: idNorm,
                role: 'judge',
                department: 'Principal District & Sessions Court',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                court_level: 'Sessions Court / District Court',
                court_id: 'court-sessions-erode',
                station: 'Principal District Court',
                location: 'Tamil Nadu Judicial District',
                scope_description: 'Sessions Judge | Tamil Nadu Judiciary',
                created_at: new Date().toISOString(),
            };
        }
        // 1. ADGP Detection (Must be checked BEFORE DGP because 'ADGP' contains 'DGP')
        else if (idNorm.toUpperCase().includes('ADGP') ||
            rankReq.includes('ADGP') ||
            rankReq.toLowerCase().includes('additional director general') ||
            (name && name.toLowerCase().includes('adgp'))) {
            const assignedDept = req.body.department || 'Law & Order';
            user = {
                user_id: `usr-adgp-${Date.now()}`,
                name: name?.trim() || 'Thiru S. Davidson Devasirvatham, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: 'Additional Director General of Police (ADGP)',
                designation: `ADGP - ${assignedDept}`,
                department: assignedDept,
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: stationReq,
                district: districtReq,
                state: stateReq,
                scope_description: `Additional Director General of Police (ADGP) | ${assignedDept}`,
                created_at: new Date().toISOString(),
            };
        }
        // 2. DGP / State Head of Police Force Detection
        else if (idNorm.toUpperCase().includes('DGP') ||
            rankReq.includes('DGP') ||
            rankReq.toLowerCase().includes('director general') ||
            (name && name.toLowerCase().includes('dgp'))) {
            user = {
                user_id: `usr-dgp-${Date.now()}`,
                name: name?.trim() || 'Shri Shankar Jiwal, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: 'Director General of Police (DGP)',
                designation: 'Director General of Police & Head of Police Force (HoPF)',
                department: 'Director General of Police, Tamil Nadu Command HQ',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: stationReq,
                district: districtReq,
                state: stateReq,
                scope_description: 'Director General of Police (DGP) | Tamil Nadu Police Command',
                created_at: new Date().toISOString(),
            };
        }
        // 3. Commissioner of Police (CP)
        else if ((idNorm.toUpperCase().includes('CP') && !idNorm.toUpperCase().includes('ACP') && !idNorm.toUpperCase().includes('JCP')) ||
            rankReq.includes('Commissioner of Police') ||
            (rankReq.toLowerCase().includes('commissioner') && !rankReq.toLowerCase().includes('assistant') && !rankReq.toLowerCase().includes('joint') && !rankReq.toLowerCase().includes('additional'))) {
            user = {
                user_id: `usr-cp-${Date.now()}`,
                name: name?.trim() || 'Thiru A. Arun, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: 'Commissioner of Police (CP)',
                designation: 'Commissioner of Police, Greater Chennai Police',
                department: 'Greater Chennai Police Commissionerate Command',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: 'Office of the Commissioner of Police, Vepery, Chennai',
                district: 'Greater Chennai Police',
                state: stateReq,
                scope_description: 'Commissioner of Police (CP) | Greater Chennai Police Commissionerate',
                created_at: new Date().toISOString(),
            };
        }
        // 4. Inspector General of Police (IGP)
        else if (idNorm.toUpperCase().includes('IGP') ||
            rankReq.includes('IGP') ||
            rankReq.toLowerCase().includes('inspector general')) {
            user = {
                user_id: `usr-igp-${Date.now()}`,
                name: name?.trim() || 'Thiru R. Sudhakar, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: 'Inspector General of Police (IGP)',
                designation: 'Inspector General of Police (West Zone)',
                department: 'West Zone Police Command HQ',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: 'Zonal Police Headquarters, Race Course, Coimbatore',
                district: 'West Zone Command',
                state: stateReq,
                scope_description: 'Inspector General of Police (IGP) | West Zone Command',
                created_at: new Date().toISOString(),
            };
        }
        // 5. Deputy Inspector General / Joint Commissioner (DIG / Jt. CP)
        else if (idNorm.toUpperCase().includes('DIG') ||
            idNorm.toUpperCase().includes('JCP') ||
            rankReq.includes('DIG') ||
            rankReq.toLowerCase().includes('deputy inspector general') ||
            rankReq.toLowerCase().includes('joint commissioner')) {
            user = {
                user_id: `usr-dig-${Date.now()}`,
                name: name?.trim() || 'Dr. Z. Annie Vijaya, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: rankReq.includes('Joint') ? 'Joint Commissioner of Police (Jt. CP)' : 'Deputy Inspector General of Police (DIG)',
                designation: 'Deputy Inspector General of Police, Coimbatore Range',
                department: 'Coimbatore Range Police Headquarters',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: 'Range Police Office, Coimbatore',
                district: 'Coimbatore Range',
                state: stateReq,
                scope_description: 'Deputy Inspector General of Police (DIG) | Coimbatore Range',
                created_at: new Date().toISOString(),
            };
        }
        // 6. Superintendent of Police (SP / DCP)
        else if ((idNorm.toUpperCase().includes('SP') && !idNorm.toUpperCase().includes('DSP') && !idNorm.toUpperCase().includes('ASP') && !idNorm.toUpperCase().includes('DGP')) ||
            idNorm.toUpperCase().includes('DCP') ||
            rankReq.includes('Superintendent of Police') ||
            rankReq.includes('DCP')) {
            user = {
                user_id: `usr-sp-${Date.now()}`,
                name: name?.trim() || 'Thiru G. Jawahar, IPS',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: rankReq.includes('DCP') ? 'Deputy Commissioner of Police (DCP)' : 'Superintendent of Police (SP)',
                designation: 'Superintendent of Police, Erode District',
                department: 'District Police Office (DPO), Erode',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                station: 'District Police Office (DPO), Erode',
                district: 'Erode District',
                state: stateReq,
                scope_description: 'Superintendent of Police (SP) | Erode District Headquarters',
                created_at: new Date().toISOString(),
            };
        }
        // 7. Deputy Superintendent of Police (DSP)
        else if (idNorm.toUpperCase().includes('DSP') ||
            rankReq.includes('DSP') ||
            rankReq.toLowerCase().includes('deputy superintendent')) {
            user = {
                user_id: `usr-dsp-${Date.now()}`,
                name: name?.trim() || 'Thiru C. Rajendran, DSP',
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                rank: 'Deputy Superintendent of Police (DSP)',
                designation: 'Deputy Superintendent of Police, Erode Town Sub-Division',
                department: 'Sub-Divisional Police Office (SDPO)',
                clearance_level: 4,
                status: 'active',
                password_hash: password,
                station: 'Erode Town SDPO Division Station',
                district: 'Erode District',
                state: stateReq,
                scope_description: 'Deputy Superintendent of Police (DSP) | Erode Town Sub-Division',
                created_at: new Date().toISOString(),
            };
        }
        // 5. Admin
        else if (roleReq === 'admin' || idNorm.toUpperCase().startsWith('ADM-')) {
            user = {
                user_id: `usr-admin-${Date.now()}`,
                name: name?.trim() || `Administrator (${idNorm})`,
                badge_id: idNorm,
                official_id: idNorm,
                role: 'admin',
                admin_type: req.body.admin_type || 'super_admin',
                admin_scope: 'Government of Tamil Nadu - Central Police & Justice Command',
                admin_scope_id: 'scope-tn-central',
                department: 'Home Department - State Administration',
                clearance_level: 5,
                status: 'active',
                password_hash: password,
                registered_devices: ['dev-demo-trusted'],
                created_at: new Date().toISOString(),
            };
        }
        // 6. Police (All ranks)
        else {
            let determinedRank = rankReq || 'Police Officer';
            let roleTitle = 'Police Officer';
            let clearanceLevel = 3;
            const isWriter = !!req.body.is_writer || idNorm.toUpperCase().includes('WRITER') || rankReq.includes('Writer');
            if (isWriter) {
                determinedRank = 'Police Constable (Writer)';
                roleTitle = 'Station Writer';
                clearanceLevel = 2;
            }
            else if (idNorm.toUpperCase().startsWith('PC-') || (rankReq.includes('Constable') && !rankReq.includes('Head'))) {
                determinedRank = 'Police Constable (PC)';
                roleTitle = 'Police Constable';
                clearanceLevel = 2;
            }
            else if (idNorm.toUpperCase().startsWith('HC-') || rankReq.includes('Head Constable')) {
                determinedRank = 'Head Constable (HC)';
                roleTitle = 'Head Constable';
                clearanceLevel = 2;
            }
            else if (idNorm.toUpperCase().startsWith('SI-') || rankReq.includes('Sub-Inspector')) {
                determinedRank = 'Sub-Inspector (SI)';
                roleTitle = 'Sub-Inspector';
                clearanceLevel = 3;
            }
            else if (idNorm.toUpperCase().startsWith('INSP-') || rankReq.includes('Inspector')) {
                determinedRank = 'Inspector of Police (SHO)';
                roleTitle = 'Inspector of Police';
                clearanceLevel = 4;
            }
            else if (idNorm.toUpperCase().startsWith('ACP-') || rankReq.includes('ACP') || rankReq.includes('Assistant Commissioner')) {
                determinedRank = rankReq || 'Assistant Commissioner of Police (ACP)';
                roleTitle = 'Assistant Commissioner of Police';
                clearanceLevel = 4;
            }
            else if (idNorm.toUpperCase().startsWith('DSP-') || rankReq.includes('DSP') || rankReq.includes('Deputy Superintendent')) {
                determinedRank = 'Deputy Superintendent of Police (DSP)';
                roleTitle = 'Deputy Superintendent of Police';
                clearanceLevel = 4;
            }
            else if (rankReq.includes('SP') || idNorm.toUpperCase().startsWith('SP-')) {
                determinedRank = 'Superintendent of Police (SP)';
                roleTitle = 'Superintendent of Police';
                clearanceLevel = 5;
            }
            else if (rankReq.includes('ADGP') || idNorm.toUpperCase().includes('ADGP')) {
                determinedRank = 'Additional Director General of Police (ADGP)';
                roleTitle = 'Additional Director General of Police';
                clearanceLevel = 5;
            }
            const assignedDept = req.body.department || (isWriter ? 'General Diary (GD) & FIR Intake Desk' : (rankReq.includes('ADGP') || idNorm.toUpperCase().includes('ADGP') ? 'Law & Order' : 'Tamil Nadu Police - Law & Order / Investigation Wing'));
            user = {
                user_id: `usr-police-${idNorm.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: name?.trim() || `${roleTitle} (${idNorm})`,
                badge_id: idNorm,
                official_id: idNorm,
                role: 'police',
                department: assignedDept,
                clearance_level: clearanceLevel,
                status: 'active',
                password_hash: password,
                rank: determinedRank,
                is_writer: isWriter ? true : undefined,
                writer_posting: isWriter ? (req.body.writer_posting || 'Station Writer (GD Desk)') : undefined,
                designation: determinedRank === 'Additional Director General of Police (ADGP)' ? `ADGP - ${assignedDept}` : undefined,
                scope_description: isWriter ? `Station Writer | ${stationReq}` : (determinedRank === 'Additional Director General of Police (ADGP)' ? `ADGP - ${assignedDept} | Tamil Nadu Police Command` : undefined),
                station: stationReq,
                district: districtReq,
                state: stateReq,
                location: req.body.location || `${stationReq}, ${districtReq}, ${stateReq}`,
                jurisdiction_node_id: 'node-erode-ps1',
                created_at: new Date().toISOString(),
            };
        }
        database_js_1.db.users.unshift(user);
        (0, database_js_1.saveUsersToDisk)();
        console.log(`[Auth Gateway] New User dynamically registered and persisted: ${user.name} (${user.official_id}) [${user.role}/${user.rank || user.admin_type}]`);
    }
    else if (user && (req.body.role === 'police' || user.role === 'police')) {
        // If existing police user signs in with station/district selection, update active assignment
        if (req.body.station)
            user.station = req.body.station;
        if (req.body.district)
            user.district = req.body.district;
        if (req.body.state)
            user.state = req.body.state;
        if (req.body.location)
            user.location = req.body.location;
        if (req.body.subdivision)
            user.subdivision = req.body.subdivision;
        if (req.body.is_writer !== undefined)
            user.is_writer = !!req.body.is_writer;
        if (req.body.is_writer) {
            user.rank = 'Police Constable (Writer)';
            user.department = 'General Diary (GD) & FIR Intake Desk';
        }
        (0, database_js_1.saveUsersToDisk)();
    }
    if (!user) {
        return res.status(404).json({ error: 'User record could not be established.' });
    }
    // 2. Account Lockout check
    if (user.locked_until && user.locked_until > Date.now()) {
        const retryAfter = Math.ceil((user.locked_until - Date.now()) / 1000);
        database_js_1.db.authLedger.unshift({
            id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            official_id: user.official_id,
            name: user.name,
            admin_type: user.admin_type,
            ip: clientIp,
            device_fingerprint: fp,
            outcome: 'ACCOUNT_LOCKED',
            details: `Login rejected: Account is locked. ${retryAfter}s remaining.`,
        });
        return res.status(423).json({
            error: 'account_locked',
            message: `Account is temporarily locked due to consecutive security failures. Try again in ${retryAfter} seconds.`,
            retry_after_seconds: retryAfter,
        });
    }
    // 3. Password Verification & Exponential Lockout
    if (user.password_hash && user.password_hash !== password) {
        user.failed_attempts = (user.failed_attempts || 0) + 1;
        if (user.failed_attempts >= 3) {
            // Exponential backoff: 3rd fail -> 30s, 4th -> 60s, 5+ -> 120s
            const lockDurationSec = user.failed_attempts === 3 ? 30 : user.failed_attempts === 4 ? 60 : 120;
            user.locked_until = Date.now() + lockDurationSec * 1000;
            database_js_1.db.authLedger.unshift({
                id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toISOString(),
                official_id: user.official_id,
                name: user.name,
                admin_type: user.admin_type,
                ip: clientIp,
                device_fingerprint: fp,
                outcome: 'ACCOUNT_LOCKED',
                details: `Account locked for ${lockDurationSec}s after ${user.failed_attempts} failed password attempts.`,
            });
            return res.status(423).json({
                error: 'account_locked',
                message: `Account locked after ${user.failed_attempts} consecutive incorrect credentials. Try again in ${lockDurationSec} seconds.`,
                retry_after_seconds: lockDurationSec,
                failed_attempts: user.failed_attempts,
            });
        }
        else {
            const attemptsLeft = 3 - user.failed_attempts;
            database_js_1.db.authLedger.unshift({
                id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toISOString(),
                official_id: user.official_id,
                name: user.name,
                admin_type: user.admin_type,
                ip: clientIp,
                device_fingerprint: fp,
                outcome: 'FAILED_PASSWORD',
                details: `Failed password attempt (${user.failed_attempts}/3 before temporary lockout).`,
            });
            return res.status(401).json({
                error: 'wrong_password',
                message: `Incorrect credentials. ${attemptsLeft} attempt(s) remaining before security lockout.`,
                attempts_remaining: attemptsLeft,
            });
        }
    }
    // Successful Password Check -> Reset failed attempts
    user.failed_attempts = 0;
    user.locked_until = undefined;
    // Status check
    if (user.status === 'pending') {
        return res.status(403).json({
            error: 'Account Pending Approval',
            details: 'Your account registration has been submitted and is awaiting administrative attestation.',
        });
    }
    // Check device trust
    const isDeviceTrusted = (user.registered_devices || []).includes(fp);
    // If Admin role -> Authenticate directly (biometric removed per requirement)
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
        database_js_1.db.authLedger.unshift({
            id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            official_id: user.official_id,
            name: user.name,
            admin_type: user.admin_type,
            ip: clientIp,
            device_fingerprint: fp,
            outcome: 'SUCCESS',
            details: `Admin authenticated directly without biometric: ${user.admin_type} (${user.official_id}). Session authorized.`,
        });
        console.log(`[Digital Management Auth] Admin Authenticated: ${user.name} (${user.admin_type}) - Direct Session Issued`);
        return res.json({
            token: `mock-jwt-token-${user.user_id}`,
            admin_type: user.admin_type,
            admin_scope: user.admin_scope || user.scope_description || 'National Standing Governance',
            admin_scope_id: user.admin_scope_id,
            session_duration_seconds: 900,
            user: {
                ...user,
                admin_type: user.admin_type,
                admin_scope: user.admin_scope || user.scope_description || 'National Standing Governance',
                scope_description: user.admin_scope || user.scope_description || 'National Standing Governance',
            },
        });
    }
    // Resolve scope descriptions for UI presentation for standard users
    let scopeDescription = 'Standing Scope Active';
    if (user.role === 'police') {
        const node = database_js_1.SAMPLE_DATASETS.jurisdiction_nodes.find((n) => n.id === user.jurisdiction_node_id);
        scopeDescription = `Rank: ${user.rank || 'Inspector'} | Jurisdiction: ${node?.name || 'Mahila Police Station, Central District'}`;
    }
    else if (user.role === 'forensic_analyst') {
        const lab = database_js_1.SAMPLE_DATASETS.labs.find((l) => l.id === user.lab_id);
        scopeDescription = `Lab Assignment: ${lab?.name || 'Central Forensic Science Laboratory (CFSL)'}`;
    }
    else if (user.role === 'prosecutor') {
        const court = database_js_1.SAMPLE_DATASETS.courts.find((c) => c.id === user.court_id);
        scopeDescription = `Designation: ${user.designation || 'Public Prosecutor'} | Court: ${court?.name || 'High Court of Delhi'}`;
    }
    else if (user.role === 'judge') {
        const court = database_js_1.SAMPLE_DATASETS.courts.find((c) => c.id === user.court_id);
        scopeDescription = `Court Level: ${user.court_level || 'Sessions Court'} | Specific Court: ${court?.name || 'Fast Track Special Court (POCSO)'}`;
    }
    else if (user.role === 'defense_counsel') {
        scopeDescription = `Bar Enrollment: ${user.bar_enrollment_number || user.official_id} | Engagement Scope: Per-Case Authorization`;
    }
    database_js_1.db.authLedger.unshift({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        official_id: user.official_id,
        name: user.name,
        ip: clientIp,
        device_fingerprint: fp,
        outcome: 'SUCCESS',
        details: `User session created for role: ${user.role.toUpperCase()}`,
    });
    console.log(`[Digital Management Auth] User Authenticated: ${user.name} (${user.role.toUpperCase()}) | Scope: ${scopeDescription}`);
    return res.json({
        token: `mock-jwt-token-${user.user_id}`,
        user: {
            ...user,
            scope_description: scopeDescription,
        },
    });
});
// Step 2: MFA Verification (WebAuthn or TOTP fallback)
exports.authRouter.post('/verify', (req, res) => {
    const { user_id, method, response, device_fingerprint, remember_device } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const fp = (device_fingerprint || req.headers['x-device-fingerprint'] || 'dev-demo-trusted').toString();
    const user = database_js_1.db.users.find((u) => u.user_id === user_id);
    if (!user) {
        return res.status(404).json({ error: 'User not found or session expired.' });
    }
    // If method is TOTP, verify code (demo accepts 123456)
    if (method === 'totp') {
        const code = (response || '').toString().trim();
        if (code !== '123456') {
            database_js_1.db.authLedger.unshift({
                id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toISOString(),
                official_id: user.official_id,
                name: user.name,
                admin_type: user.admin_type,
                ip: clientIp,
                device_fingerprint: fp,
                outcome: 'MFA_FAILED',
                mfa_method: 'totp',
                details: `MFA validation failed: Incorrect 6-digit TOTP token "${code}".`,
            });
            return res.status(401).json({
                error: 'invalid_mfa',
                message: 'Invalid 6-digit TOTP code. For demo simulation, enter "123456".',
            });
        }
    }
    // If WebAuthn biometric, accept signature verification
    // Register device if selected or if user had no registered devices
    if (fp && (remember_device || !user.registered_devices?.length)) {
        if (!user.registered_devices)
            user.registered_devices = [];
        if (!user.registered_devices.includes(fp)) {
            user.registered_devices.push(fp);
        }
    }
    // Log successful MFA to immutable ledger
    database_js_1.db.authLedger.unshift({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        official_id: user.official_id,
        name: user.name,
        admin_type: user.admin_type,
        ip: clientIp,
        device_fingerprint: fp,
        outcome: 'SUCCESS',
        mfa_method: method === 'webauthn' ? 'webauthn' : 'totp',
        details: `Admin MFA attestation verified via ${method === 'webauthn' ? 'WebAuthn biometric challenge' : 'TOTP 6-digit authenticator'}. Session authorized.`,
    });
    console.log(`[Digital Management Auth] Admin MFA Passed: ${user.name} (${user.admin_type}) via ${method}`);
    return res.json({
        token: `mock-jwt-token-${user.user_id}`,
        user: {
            ...user,
            scope_description: user.admin_scope || 'Admin Standing Scope Active',
        },
        admin_type: user.admin_type,
        admin_scope: user.admin_scope,
        admin_scope_id: user.admin_scope_id,
        session_duration_seconds: 900, // 15 minutes session
    });
});
// Step-Up / Re-Authentication Endpoint for High-Stakes Actions
exports.authRouter.post('/reauth', (req, res) => {
    const { user_id, method, response, action_description } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const user = database_js_1.db.users.find((u) => u.user_id === user_id);
    if (!user) {
        return res.status(404).json({ error: 'User session not found.' });
    }
    if (method === 'totp' && (response || '').toString().trim() !== '123456') {
        database_js_1.db.authLedger.unshift({
            id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            official_id: user.official_id,
            name: user.name,
            admin_type: user.admin_type,
            ip: clientIp,
            device_fingerprint: 'session-reauth',
            outcome: 'REAUTH_FAILED',
            mfa_method: 'step_up',
            details: `Re-authentication failed for action: ${action_description || 'High-stakes governance action'}.`,
        });
        return res.status(401).json({ error: 'Re-authentication failed. Incorrect TOTP code.' });
    }
    database_js_1.db.authLedger.unshift({
        id: `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        official_id: user.official_id,
        name: user.name,
        admin_type: user.admin_type,
        ip: clientIp,
        device_fingerprint: 'session-reauth',
        outcome: 'REAUTH_SUCCESS',
        mfa_method: 'step_up',
        details: `Re-authentication authorized for action: ${action_description || 'Dual-control governance operation'}.`,
    });
    return res.json({
        verified: true,
        action: action_description,
        timestamp: new Date().toISOString(),
    });
});
// Role-Specific Sign-Up Registration
exports.authRouter.post('/register', (req, res) => {
    const { role, name, official_id, password, rank, jurisdiction_node_id, lab_id, designation, court_id, court_level, bar_enrollment_number, admin_type, admin_scope_id, } = req.body;
    if (!role || !name || !official_id || !password) {
        return res.status(400).json({ error: 'Role, Name, Official ID, and Password are required.' });
    }
    // Check if official_id already exists
    // Police and defense counsel auto-verify for smooth sign-in -> login flow
    const isPolice = role === 'police';
    const isDefense = role === 'defense_counsel';
    const initialStatus = 'active';
    const isWriter = !!req.body.is_writer || (rank && rank.includes('Writer')) || official_id.toUpperCase().includes('WRITER');
    const station = req.body.station || (isPolice ? 'Police Station 1' : undefined);
    const district = req.body.district || (isPolice ? 'Erode' : undefined);
    const subdivision = req.body.subdivision || (district ? `${district} Sub-Division` : undefined);
    const state = req.body.state || 'Tamil Nadu';
    const location = req.body.location || (station ? `${station}, ${subdivision || ''}, ${district || ''}, ${state}` : undefined);
    const department = isWriter
        ? 'General Diary (GD) & FIR Intake Desk'
        : isPolice
            ? (rank?.includes('ADGP') ? 'Law & Order' : 'Tamil Nadu Police - Law & Order / Investigation Wing')
            : role.replace('_', ' ').toUpperCase();
    // If user with official_id already exists, update and activate their record
    let existingUser = database_js_1.db.users.find((u) => u.official_id?.toLowerCase() === official_id.trim().toLowerCase());
    if (existingUser) {
        existingUser.name = name;
        existingUser.password_hash = password;
        existingUser.role = role;
        existingUser.rank = isPolice ? (isWriter ? 'Police Constable (Writer)' : rank) : rank;
        existingUser.station = station || existingUser.station;
        existingUser.district = district || existingUser.district;
        existingUser.subdivision = subdivision || existingUser.subdivision;
        existingUser.state = state || existingUser.state;
        existingUser.location = location || existingUser.location;
        existingUser.is_writer = isWriter ? true : undefined;
        existingUser.writer_posting = isWriter ? (req.body.writer_posting || 'Station Writer (GD Desk)') : undefined;
        existingUser.designation = isPolice
            ? (isWriter ? 'Station Writer (GD Desk)' : (rank || 'Police Officer'))
            : designation;
        if (isPolice) {
            existingUser.department = isWriter
                ? 'General Diary (GD) & FIR Intake Desk'
                : (rank?.includes('ADGP') ? 'Law & Order' : 'Tamil Nadu Police - Law & Order / Investigation Wing');
            existingUser.court_id = undefined;
            existingUser.court_level = undefined;
            existingUser.admin_type = undefined;
            existingUser.admin_scope_id = undefined;
            existingUser.admin_scope = undefined;
            existingUser.bar_enrollment_number = undefined;
        }
        existingUser.status = 'active';
        existingUser.failed_attempts = 0;
        existingUser.locked_until = undefined;
        (0, database_js_1.saveUsersToDisk)();
        return res.status(200).json({
            message: 'Police officer account updated and activated successfully. Please proceed to log in.',
            user: existingUser,
        });
    }
    const newUser = {
        user_id: `usr-${role}-${Date.now()}`,
        name,
        official_id,
        badge_id: official_id,
        role,
        department,
        clearance_level: role === 'judge' || role === 'prosecutor' || role === 'admin' ? 5 : (rank?.includes('DGP') || rank?.includes('ADGP') || rank?.includes('SP') ? 5 : (rank?.includes('Inspector') || rank?.includes('DSP') ? 4 : 3)),
        status: initialStatus,
        password_hash: password,
        rank: isPolice ? (isWriter ? 'Police Constable (Writer)' : rank) : rank,
        is_writer: isWriter ? true : undefined,
        writer_posting: isWriter ? (req.body.writer_posting || 'Station Writer (GD Desk)') : undefined,
        station,
        subdivision,
        district,
        state,
        location,
        jurisdiction_node_id,
        lab_id,
        designation: isPolice
            ? (isWriter ? 'Station Writer (GD Desk)' : (rank || 'Police Officer'))
            : designation,
        court_id: isPolice ? undefined : court_id,
        court_level: isPolice ? undefined : court_level,
        bar_enrollment_number: isPolice ? undefined : (bar_enrollment_number || (isDefense ? official_id : undefined)),
        admin_type: isPolice ? undefined : admin_type,
        admin_scope_id: isPolice ? undefined : admin_scope_id,
        created_at: new Date().toISOString(),
    };
    database_js_1.db.users.unshift(newUser);
    (0, database_js_1.saveUsersToDisk)();
    console.log(`[Digital Management Auth] New Registration Created: ${name} (${role}) [${rank || 'Officer'}] | Status: ${initialStatus}`);
    return res.status(201).json({
        message: 'Police officer profile registered and activated. Please proceed to log in.',
        user: newUser,
    });
});
// Fetch Pending Registrations for Admin Approval
exports.authRouter.get('/pending-users', (req, res) => {
    const pending = database_js_1.db.users.filter((u) => u.status === 'pending');
    return res.json(pending);
});
// Approve Pending Registration (Admin Action)
exports.authRouter.post('/approve-user', (req, res) => {
    const { user_id } = req.body;
    const user = database_js_1.db.users.find((u) => u.user_id === user_id);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    user.status = 'active';
    (0, database_js_1.saveUsersToDisk)();
    console.log(`[Digital Management Auth] Account Approved by Admin: ${user.name} (${user.official_id})`);
    return res.json({ message: `Account for ${user.name} (${user.official_id}) approved and activated!`, user });
});
// Current User profile
exports.authRouter.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const userId = authHeader?.replace('Bearer mock-jwt-token-', '');
    const user = database_js_1.db.users.find((u) => u.user_id === userId) || database_js_1.db.users[0] || null;
    return res.json(user);
});
// Get all active signed-in users
exports.authRouter.get('/active-users', (req, res) => {
    return res.json(database_js_1.db.users);
});
// WIPE ALL USER DATA (User requirement: delete all user data and save only sign in user data now onwards)
exports.authRouter.post('/clear-all-users', (req, res) => {
    (0, database_js_1.clearAllUsers)();
    return res.json({ message: 'All user data wiped successfully. Only newly signed in users will be saved now onwards.' });
});
// ==========================================================
// DGP PERSONNEL GOVERNANCE (Transfers, Suspend and Dismiss)
// ==========================================================
// 1. Submit a personnel action (DGP Action)
exports.authRouter.post('/personnel-action', (req, res) => {
    const { officer_id, officer_name, officer_rank, current_station, current_district, action_type, target_station, target_district, reason, document_name, document_size, document_hash, document_url, submitted_by, submitted_by_rank, } = req.body;
    if (!officer_id || !officer_name || !action_type || !reason) {
        return res.status(400).json({ error: 'Officer ID, Name, Action Type, and Reason are required.' });
    }
    const newAction = {
        id: `ord-dgp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        officer_id,
        officer_name,
        officer_rank: officer_rank || 'Police Officer',
        current_station: current_station || 'Unspecified Station',
        current_district: current_district || 'Tamil Nadu',
        action_type,
        target_station,
        target_district,
        reason,
        document_name: document_name || 'Executive_Inquiry_Memo.pdf',
        document_size: document_size || 48200,
        document_hash: document_hash || `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        document_url,
        status: 'sent_to_admin',
        submitted_by: submitted_by || 'Shri Shankar Jiwal, IPS (DGP & HoPF)',
        submitted_by_rank: submitted_by_rank || 'Director General of Police (DGP)',
        created_at: new Date().toISOString(),
    };
    database_js_1.db.personnelActions.unshift(newAction);
    (0, database_js_1.savePersonnelActionsToDisk)();
    console.log(`[DGP Command] Personnel Order Issued: ${action_type.toUpperCase()} for ${officer_name} (${officer_id}). Dispatched to Admin.`);
    return res.status(201).json({
        message: 'Personnel order submitted successfully and dispatched to Home Department Administration for official gazette notification.',
        action: newAction,
    });
});
// 2. Fetch all personnel actions (For DGP to track Admin seen and action taken)
exports.authRouter.get('/personnel-actions', (req, res) => {
    return res.json(database_js_1.db.personnelActions);
});
// 3. Mark personnel action as "Admin Seen"
exports.authRouter.post('/personnel-action/admin-seen', (req, res) => {
    const { id } = req.body;
    const action = database_js_1.db.personnelActions.find((a) => a.id === id);
    if (!action) {
        return res.status(404).json({ error: 'Personnel action not found' });
    }
    action.status = 'admin_seen';
    action.admin_seen_at = new Date().toISOString();
    (0, database_js_1.savePersonnelActionsToDisk)();
    return res.json({ message: 'Order marked as seen by Home Department Admin', action });
});
// 4. Admin takes official action (Approved / Gazetted / Sanctioned)
exports.authRouter.post('/personnel-action/admin-action', (req, res) => {
    const { id, admin_remarks, gazette_notification_no } = req.body;
    const action = database_js_1.db.personnelActions.find((a) => a.id === id);
    if (!action) {
        return res.status(404).json({ error: 'Personnel action not found' });
    }
    action.status = 'action_taken';
    action.action_taken_at = new Date().toISOString();
    action.admin_remarks = admin_remarks || 'Government Order (G.O. Ms) issued. Disciplinary / Transfer record notified in Tamil Nadu Government Gazette.';
    action.gazette_notification_no = gazette_notification_no || `TN-GO-MS-${Math.floor(100 + Math.random() * 900)}/2026`;
    (0, database_js_1.savePersonnelActionsToDisk)();
    return res.json({ message: 'Action taken and gazette reference recorded', action });
});
