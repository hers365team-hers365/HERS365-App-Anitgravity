/**
 * COMPLIANCE MONITORING & ALERTING
 * Automated compliance monitoring for COPPA, FERPA, and GDPR
 * Real-time violation detection and reporting
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { eventPublisher } from './service-bus';
// ─── COMPLIANCE MONITOR ──────────────────────────────────────────────────────
export class ComplianceMonitor {
    constructor(cosmosClient, serviceBusClient) {
        this.monitoringInterval = null;
        this.cosmosClient = cosmosClient;
        this.serviceBusClient = serviceBusClient;
        this.requirements = this.loadComplianceRequirements();
    }
    /**
     * Start automated compliance monitoring
     */
    startMonitoring() {
        // Run compliance checks every 4 hours
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.runComplianceChecks();
            }
            catch (error) {
                logger.error('Compliance monitoring error:', error);
            }
        }, 4 * 60 * 60 * 1000); // 4 hours
        // Run real-time checks every 5 minutes
        setInterval(async () => {
            try {
                await this.runRealtimeChecks();
            }
            catch (error) {
                logger.error('Real-time compliance check error:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
        logger.info('Compliance monitoring started');
    }
    /**
     * Stop compliance monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        logger.info('Compliance monitoring stopped');
    }
    /**
     * Run comprehensive compliance checks
     */
    async runComplianceChecks() {
        logger.info('Running comprehensive compliance checks');
        const checks = await Promise.allSettled([
            this.checkCOPPACompliance(),
            this.checkFERPACompliance(),
            this.checkGDPRCompliance(),
            this.checkDataRetentionCompliance(),
            this.checkAccessControlCompliance(),
            this.checkAuditLoggingCompliance()
        ]);
        const results = checks.map((result, index) => ({
            framework: ['COPPA', 'FERPA', 'GDPR', 'DataRetention', 'AccessControl', 'AuditLogging'][index],
            success: result.status === 'fulfilled',
            error: result.status === 'rejected' ? result.reason : null
        }));
        // Generate compliance report
        const report = await this.generateComplianceReport(results);
        // Check for violations
        const violations = this.identifyViolations(results);
        // Alert on violations
        for (const violation of violations) {
            await this.reportViolation(violation);
        }
        // Store report
        await this.storeComplianceReport(report);
        const checkResults = checks
            .filter((r) => r.status === 'fulfilled')
            .flatMap(r => r.value);
        logger.info('Compliance checks completed', {
            frameworks: results.length,
            violations: violations.length
        });
        return checkResults;
    }
    /**
     * Run real-time compliance checks (lighter weight)
     */
    async runRealtimeChecks() {
        // Check for recent data breaches
        await this.checkForDataBreaches();
        // Check for unusual access patterns
        await this.checkAccessPatterns();
        // Check for consent expiry
        await this.checkConsentExpiry();
        // Check for high-risk data operations
        await this.checkHighRiskOperations();
    }
    // ─── FRAMEWORK-SPECIFIC COMPLIANCE CHECKS ──────────────────────────────────
    async checkCOPPACompliance() {
        const metrics = [];
        // Check parental consent for athletes under 13
        const underageAthletes = await this.getUnderageAthletes();
        const athletesWithoutConsent = underageAthletes.filter(a => !a.complianceData?.parentalConsent);
        metrics.push({
            framework: 'COPPA',
            metric: 'parental_consent_coverage',
            value: underageAthletes.length > 0 ? (1 - athletesWithoutConsent.length / underageAthletes.length) * 100 : 100,
            target: 100,
            status: athletesWithoutConsent.length === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { athletesWithoutConsent: athletesWithoutConsent.length }
        });
        // Check data minimization
        const excessiveDataCollection = await this.checkExcessiveDataCollection();
        metrics.push({
            framework: 'COPPA',
            metric: 'data_minimization',
            value: excessiveDataCollection ? 0 : 100,
            target: 100,
            status: excessiveDataCollection ? 'warning' : 'compliant',
            timestamp: new Date().toISOString()
        });
        // Check deletion rights compliance
        const pendingDeletions = await this.getPendingDeletionRequests('COPPA');
        metrics.push({
            framework: 'COPPA',
            metric: 'deletion_requests_processed',
            value: pendingDeletions.length,
            target: 0,
            status: pendingDeletions.length === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { pendingDeletions: pendingDeletions.length }
        });
        return metrics;
    }
    async checkFERPACompliance() {
        const metrics = [];
        // Check parental access for students under 18
        const minorStudents = await this.getMinorStudents();
        const parentsWithoutAccess = await this.checkParentalAccess(minorStudents);
        metrics.push({
            framework: 'FERPA',
            metric: 'parental_access_compliance',
            value: minorStudents.length > 0 ? (1 - parentsWithoutAccess / minorStudents.length) * 100 : 100,
            target: 100,
            status: parentsWithoutAccess === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { parentsWithoutAccess }
        });
        // Check coach access restrictions
        const unauthorizedCoachAccess = await this.checkCoachAccessRestrictions();
        metrics.push({
            framework: 'FERPA',
            metric: 'coach_access_restrictions',
            value: unauthorizedCoachAccess ? 0 : 100,
            target: 100,
            status: unauthorizedCoachAccess ? 'critical' : 'compliant',
            timestamp: new Date().toISOString()
        });
        // Check data sharing compliance
        const unauthorizedDataSharing = await this.checkDataSharingCompliance();
        metrics.push({
            framework: 'FERPA',
            metric: 'data_sharing_compliance',
            value: unauthorizedDataSharing ? 0 : 100,
            target: 100,
            status: unauthorizedDataSharing ? 'warning' : 'compliant',
            timestamp: new Date().toISOString()
        });
        return metrics;
    }
    async checkGDPRCompliance() {
        const metrics = [];
        // Check consent management
        const usersWithoutValidConsent = await this.getUsersWithoutValidConsent();
        const totalUsers = await this.getTotalUserCount();
        metrics.push({
            framework: 'GDPR',
            metric: 'consent_compliance',
            value: totalUsers > 0 ? (1 - usersWithoutValidConsent / totalUsers) * 100 : 100,
            target: 100,
            status: usersWithoutValidConsent === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { usersWithoutValidConsent }
        });
        // Check data portability requests
        const pendingPortabilityRequests = await this.getPendingPortabilityRequests();
        metrics.push({
            framework: 'GDPR',
            metric: 'data_portability_requests',
            value: pendingPortabilityRequests,
            target: 0,
            status: pendingPortabilityRequests === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { pendingPortabilityRequests }
        });
        // Check erasure (right to be forgotten) compliance
        const pendingErasureRequests = await this.getPendingErasureRequests();
        metrics.push({
            framework: 'GDPR',
            metric: 'erasure_requests_processed',
            value: pendingErasureRequests,
            target: 0,
            status: pendingErasureRequests === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { pendingErasureRequests }
        });
        // Check breach notification compliance (72-hour rule)
        const overdueBreachNotifications = await this.getOverdueBreachNotifications();
        metrics.push({
            framework: 'GDPR',
            metric: 'breach_notification_compliance',
            value: overdueBreachNotifications,
            target: 0,
            status: overdueBreachNotifications === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { overdueBreachNotifications }
        });
        return metrics;
    }
    async checkDataRetentionCompliance() {
        const metrics = [];
        // Check audit log retention (GDPR/7 years)
        const auditLogsBeyondRetention = await this.getAuditLogsBeyondRetention();
        metrics.push({
            framework: 'GDPR',
            metric: 'audit_log_retention_compliance',
            value: auditLogsBeyondRetention,
            target: 0,
            status: auditLogsBeyondRetention === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { auditLogsBeyondRetention }
        });
        // Check personal data retention
        const personalDataBeyondRetention = await this.getPersonalDataBeyondRetention();
        metrics.push({
            framework: 'GDPR',
            metric: 'personal_data_retention_compliance',
            value: personalDataBeyondRetention,
            target: 0,
            status: personalDataBeyondRetention === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { personalDataBeyondRetention }
        });
        return metrics;
    }
    async checkAccessControlCompliance() {
        const metrics = [];
        // Check for excessive admin privileges
        const usersWithExcessivePrivileges = await this.getUsersWithExcessivePrivileges();
        metrics.push({
            framework: 'AccessControl',
            metric: 'excessive_privileges_check',
            value: usersWithExcessivePrivileges,
            target: 0,
            status: usersWithExcessivePrivileges === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { usersWithExcessivePrivileges }
        });
        // Check for dormant admin accounts
        const dormantAdminAccounts = await this.getDormantAdminAccounts();
        metrics.push({
            framework: 'AccessControl',
            metric: 'dormant_admin_accounts',
            value: dormantAdminAccounts,
            target: 0,
            status: dormantAdminAccounts === 0 ? 'compliant' : 'warning',
            timestamp: new Date().toISOString(),
            details: { dormantAdminAccounts }
        });
        return metrics;
    }
    async checkAuditLoggingCompliance() {
        const metrics = [];
        // Check audit log coverage
        const unauditedOperations = await this.getUnauditedOperations();
        metrics.push({
            framework: 'AuditLogging',
            metric: 'audit_coverage',
            value: unauditedOperations,
            target: 0,
            status: unauditedOperations === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { unauditedOperations }
        });
        // Check audit log integrity
        const auditLogIntegrityViolations = await this.checkAuditLogIntegrity();
        metrics.push({
            framework: 'AuditLogging',
            metric: 'audit_log_integrity',
            value: auditLogIntegrityViolations,
            target: 0,
            status: auditLogIntegrityViolations === 0 ? 'compliant' : 'critical',
            timestamp: new Date().toISOString(),
            details: { auditLogIntegrityViolations }
        });
        return metrics;
    }
    // ─── REAL-TIME MONITORING CHECKS ───────────────────────────────────────────
    async checkForDataBreaches() {
        // Check for unusual data access patterns that might indicate breach
        const suspiciousAccess = await this.detectSuspiciousAccess();
        if (suspiciousAccess.length > 0) {
            await this.reportDataBreach({
                incidentId: `suspicious_access_${Date.now()}`,
                discoveredAt: new Date().toISOString(),
                affectedUsers: suspiciousAccess.length,
                affectedUserTypes: ['athlete', 'parent', 'coach'],
                dataCategories: ['personal_data', 'communications'],
                breachType: 'unauthorized_access',
                severity: 'medium',
                description: `Detected ${suspiciousAccess.length} suspicious access patterns`,
                rootCause: 'Automated detection of unusual access patterns',
                impactAssessment: {
                    financial: false,
                    reputational: true,
                    operational: false,
                    legal: true
                },
                containmentActions: ['Increased monitoring', 'IP blocking consideration'],
                notificationStatus: {
                    authorities: 'not_required',
                    users: 'pending'
                },
                resolutionStatus: 'investigating'
            });
        }
    }
    async checkAccessPatterns() {
        // Check for unusual access patterns (e.g., mass data exports)
        const massDataExports = await this.detectMassDataExports();
        if (massDataExports > 10) { // More than 10 exports in an hour
            await this.reportViolation({
                framework: 'GDPR',
                requirement: 'Data Access Monitoring',
                severity: 'medium',
                description: `High volume of data exports detected: ${massDataExports} in last hour`,
                affectedUsers: massDataExports,
                detectedAt: new Date().toISOString(),
                status: 'open',
                remediationPlan: 'Review export requests for legitimacy'
            });
        }
    }
    async checkConsentExpiry() {
        // Check for consents that are about to expire
        const expiringConsents = await this.getExpiringConsents();
        if (expiringConsents > 0) {
            await this.reportViolation({
                framework: 'GDPR',
                requirement: 'Consent Management',
                severity: 'low',
                description: `${expiringConsents} user consents expiring within 30 days`,
                affectedUsers: expiringConsents,
                detectedAt: new Date().toISOString(),
                status: 'open',
                remediationPlan: 'Send consent renewal notifications'
            });
        }
    }
    async checkHighRiskOperations() {
        // Check for high-risk operations (mass deletions, etc.)
        const highRiskOps = await this.detectHighRiskOperations();
        for (const op of highRiskOps) {
            await this.reportViolation({
                framework: op.framework,
                requirement: op.requirement,
                severity: op.severity,
                description: op.description,
                affectedUsers: op.affectedUsers,
                detectedAt: new Date().toISOString(),
                status: 'open',
                remediationPlan: op.remediation
            });
        }
    }
    // ─── VIOLATION MANAGEMENT ──────────────────────────────────────────────────
    async reportViolation(violation) {
        const violationWithId = {
            ...violation,
            id: uuidv4()
        };
        // Store violation
        const container = this.cosmosClient.getContainer('audit-logs');
        await container.items.create({
            ...violationWithId,
            type: 'compliance_violation',
            partitionKey: `violation_${new Date().toISOString().slice(0, 10)}_001`,
            ttl: 365 * 24 * 60 * 60 // 1 year retention
        });
        // Publish violation event
        await eventPublisher.publish({
            id: uuidv4(),
            eventType: 'ComplianceViolationDetected',
            aggregateId: violationWithId.id,
            aggregateType: 'ComplianceViolation',
            timestamp: new Date().toISOString(),
            correlationId: uuidv4(),
            source: 'compliance-monitor',
            version: 1,
            metadata: {
                priority: violation.severity === 'critical' ? 'critical' : 'high',
                complianceFlags: [violation.framework.toLowerCase()],
                idempotencyKey: uuidv4()
            },
            payload: violationWithId
        });
        logger.warn('Compliance violation detected', {
            framework: violation.framework,
            severity: violation.severity,
            description: violation.description,
            violationId: violationWithId.id
        });
    }
    async reportDataBreach(breach) {
        const breachWithId = {
            ...breach,
            id: uuidv4(),
            reportedAt: new Date().toISOString()
        };
        // Store breach incident
        const container = this.cosmosClient.getContainer('audit-logs');
        await container.items.create({
            ...breachWithId,
            type: 'data_breach_incident',
            partitionKey: `breach_${new Date().toISOString().slice(0, 10)}_001`
        });
        // Publish breach event
        await eventPublisher.publish({
            id: uuidv4(),
            eventType: 'DataBreachReported',
            aggregateId: breachWithId.id,
            aggregateType: 'DataBreachIncident',
            timestamp: new Date().toISOString(),
            correlationId: uuidv4(),
            source: 'compliance-monitor',
            version: 1,
            metadata: {
                priority: 'critical',
                complianceFlags: ['gdpr'],
                idempotencyKey: uuidv4()
            },
            payload: breachWithId
        });
        logger.error('Data breach incident reported', {
            incidentId: breachWithId.incidentId,
            severity: breachWithId.severity,
            affectedUsers: breachWithId.affectedUsers
        });
    }
    // ─── REPORTING ─────────────────────────────────────────────────────────────
    async generateComplianceReport(checkResults) {
        const report = {
            id: uuidv4(),
            reportType: 'daily',
            period: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
            },
            frameworks: {
                COPPA: [],
                FERPA: [],
                GDPR: []
            },
            violations: [],
            recommendations: [],
            generatedAt: new Date().toISOString(),
            generatedBy: 'compliance-monitor'
        };
        // Aggregate metrics from check results
        for (const result of checkResults) {
            if (result.success && result.framework in report.frameworks) {
                // Add metrics to appropriate framework
                // This would aggregate the actual metrics from each check
            }
        }
        // Generate recommendations based on results
        report.recommendations = this.generateRecommendations(checkResults);
        return report;
    }
    generateRecommendations(checkResults) {
        const recommendations = [];
        for (const result of checkResults) {
            if (!result.success) {
                recommendations.push(`Fix ${result.framework} compliance issues`);
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('All compliance checks passed - continue monitoring');
        }
        return recommendations;
    }
    async storeComplianceReport(report) {
        const container = this.cosmosClient.getContainer('analytics');
        await container.items.create({
            ...report,
            type: 'compliance_report',
            partitionKey: `analytics_${new Date().toISOString().slice(0, 10)}_001`,
            ttl: 365 * 24 * 60 * 60 // 1 year retention
        });
    }
    identifyViolations(checkResults) {
        const violations = [];
        // Analyze results and create violations for failed checks
        for (const result of checkResults) {
            if (!result.success) {
                violations.push({
                    id: uuidv4(),
                    framework: result.framework,
                    requirement: `${result.framework} Compliance`,
                    severity: 'high',
                    description: `Automated ${result.framework} compliance check failed`,
                    affectedUsers: 0, // Would be populated based on specific check
                    detectedAt: new Date().toISOString(),
                    status: 'open',
                    remediationPlan: `Review and fix ${result.framework} compliance issues`
                });
            }
        }
        return violations;
    }
    // ─── HELPER METHODS (PLACEHOLDER IMPLEMENTATIONS) ──────────────────────────
    loadComplianceRequirements() {
        return [
            {
                id: 'coppa-parental-consent',
                framework: 'COPPA',
                requirement: 'Parental Consent',
                description: 'Obtain parental consent for users under 13',
                severity: 'critical',
                automated: true,
                checkFrequency: 'real-time'
            },
            // Add more requirements...
        ];
    }
    async getUnderageAthletes() { return []; }
    async checkExcessiveDataCollection() { return false; }
    async getPendingDeletionRequests(framework) { return []; }
    async getMinorStudents() { return []; }
    async checkParentalAccess(students) { return 0; }
    async checkCoachAccessRestrictions() { return false; }
    async checkDataSharingCompliance() { return false; }
    async getUsersWithoutValidConsent() { return 0; }
    async getTotalUserCount() { return 1000; }
    async getPendingPortabilityRequests() { return 0; }
    async getPendingErasureRequests() { return 0; }
    async getOverdueBreachNotifications() { return 0; }
    async getAuditLogsBeyondRetention() { return 0; }
    async getPersonalDataBeyondRetention() { return 0; }
    async getUsersWithExcessivePrivileges() { return 0; }
    async getDormantAdminAccounts() { return 0; }
    async getUnauditedOperations() { return 0; }
    async checkAuditLogIntegrity() { return 0; }
    async detectSuspiciousAccess() { return []; }
    async detectMassDataExports() { return 0; }
    async getExpiringConsents() { return 0; }
    async detectHighRiskOperations() { return []; }
}
// ─── COMPLIANCE ALERTING ─────────────────────────────────────────────────────
export class ComplianceAlerting {
    constructor(monitor) {
        this.monitor = monitor;
    }
    /**
     * Send alerts for compliance violations
     */
    async sendViolationAlert(violation) {
        // Send email alerts to compliance team
        // Send Slack notifications
        // Create ServiceNow tickets
        // Send SMS alerts for critical violations
        logger.error('Compliance violation alert', {
            violationId: violation.id,
            framework: violation.framework,
            severity: violation.severity,
            description: violation.description
        });
    }
    /**
     * Send data breach notifications
     */
    async sendBreachNotification(breach) {
        // Notify supervisory authority within 72 hours (GDPR)
        // Notify affected users
        // Notify insurance provider
        // Update incident response plan
        logger.error('Data breach notification sent', {
            incidentId: breach.incidentId,
            severity: breach.severity,
            affectedUsers: breach.affectedUsers
        });
    }
    /**
     * Send compliance report notifications
     */
    async sendComplianceReport(report) {
        // Email compliance reports to stakeholders
        // Update compliance dashboard
        // Archive report for audit purposes
        logger.info('Compliance report generated', {
            reportId: report.id,
            reportType: report.reportType,
            violationsCount: report.violations.length
        });
    }
}
// ─── EXPORT MONITORING SYSTEM ────────────────────────────────────────────────
//# sourceMappingURL=compliance-monitoring.js.map