/**
 * THREAT MODELING ANALYSIS
 * HERS365 Sports Recruiting Platform Authentication System
 *
 * Platform Context:
 * - Involves minors (student athletes) - COPPA compliance required
 * - Financial transactions (NIL deals) - GDPR/PCI DSS compliance
 * - Real-time communication between athletes, parents, coaches
 * - Enterprise scale: 50K+ concurrent users expected
 * - Malicious abuse scenarios: account takeover, data theft, fraud
 */
export declare const THREAT_MODEL: {
    STRIDE: {
        SPOOFING: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
        TAMPERING: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
        REPUDIATION: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
        INFORMATION_DISCLOSURE: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
        DENIAL_OF_SERVICE: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
        ELEVATION_OF_PRIVILEGE: {
            threat: string;
            description: string;
            impact: string;
            likelihood: string;
            mitigation: string[];
        }[];
    };
    COMPLIANCE: {
        COPPA: string[];
        FERPA: string[];
        GDPR: string[];
        PCI_DSS: string[];
    };
    ATTACK_VECTORS: {
        ATHLETE_TARGETING: string[];
        FINANCIAL_EXPLOITATION: string[];
        SCALE_EXPLOITATION: string[];
    };
    RISK_MATRIX: {
        CRITICAL: string[];
        HIGH: string[];
        MEDIUM: string[];
    };
};
/**
 * SECURITY CONTROLS IMPLEMENTATION PRIORITY
 *
 * Phase 1 (Critical - Must Implement):
 * 1. MFA for all users
 * 2. Refresh token rotation
 * 3. Session management & revocation
 * 4. Enhanced brute force protection
 * 5. COPPA compliance verification
 *
 * Phase 2 (High Priority):
 * 6. Comprehensive audit logging
 * 7. Token lifecycle management
 * 8. Distributed rate limiting
 * 9. Privacy by design implementation
 *
 * Phase 3 (Medium Priority):
 * 10. Advanced threat detection
 * 11. Zero-trust architecture
 * 12. Regular security assessments
 */ 
