"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABACService = void 0;
const database_js_1 = require("../db/database.js");
class ABACService {
    /**
     * Enforces Attribute-Based Access Control (ABAC) with time-bound expiry checks
     */
    static checkAccess(userId, docId, requiredPermission = 'view') {
        const user = database_js_1.db.users.find((u) => u.user_id === userId);
        if (!user) {
            return { allowed: false, reason: `User ${userId} does not exist.` };
        }
        const doc = database_js_1.db.documents.find((d) => d.doc_id === docId);
        if (!doc) {
            return { allowed: false, reason: `Document ${docId} does not exist.` };
        }
        const caseItem = database_js_1.db.cases.find((c) => c.case_id === doc.case_id);
        // 1. Admin & Judge Override
        if (user.role === 'admin' || user.role === 'judge') {
            return { allowed: true, reason: `Access granted under executive clearance role (${user.role.toUpperCase()}).` };
        }
        // 2. Check Time-Bound Access Grants (e.g. Defense Counsel 14-day window)
        const activeGrant = database_js_1.db.accessGrants.find((g) => g.doc_id === docId && g.granted_to === userId);
        if (activeGrant) {
            const now = new Date();
            const validFrom = new Date(activeGrant.valid_from);
            const validUntil = new Date(activeGrant.valid_until);
            if (now < validFrom) {
                return {
                    allowed: false,
                    reason: `Access grant is not active yet. Valid from: ${activeGrant.valid_from}`,
                    grant: activeGrant,
                };
            }
            if (now > validUntil) {
                return {
                    allowed: false,
                    reason: `ACCESS DENIED: Time-bound access window expired on ${activeGrant.valid_until}. Request formal re-authorization.`,
                    grant: activeGrant,
                };
            }
            return {
                allowed: true,
                reason: `Access granted under active time-bound authorization grant (${activeGrant.grant_id}). Valid until ${activeGrant.valid_until}.`,
                grant: activeGrant,
            };
        }
        // 3. Defense Counsel without explicit active grant
        if (user.role === 'defense_counsel') {
            return {
                allowed: false,
                reason: `ACCESS DENIED: Defense counsel requires explicit, time-bound judicial access grant under Section 207 CrPC / ABAC Policy.`,
            };
        }
        // 4. Case Assignment & Clearance Check for Officers
        if (caseItem) {
            const isAssigned = caseItem.assigned_officers.includes(userId) || doc.uploaded_by === userId;
            // Sensitivity Clearance Check
            let requiredClearance = 2;
            if (caseItem.sensitivity_level === 'pocso_women_safety') {
                requiredClearance = 3;
            }
            if (user.clearance_level < requiredClearance) {
                return {
                    allowed: false,
                    reason: `ACCESS DENIED: Insufficient clearance level (${user.clearance_level}). Document requires Level ${requiredClearance} (${caseItem.sensitivity_level.toUpperCase()}).`,
                };
            }
            if (isAssigned) {
                return {
                    allowed: true,
                    reason: `Access granted via official case assignment (${caseItem.case_number}).`,
                };
            }
        }
        return {
            allowed: false,
            reason: `ACCESS DENIED: User ${user.badge_id} is not assigned to Case ${caseItem?.case_number || 'N/A'}.`,
        };
    }
}
exports.ABACService = ABACService;
