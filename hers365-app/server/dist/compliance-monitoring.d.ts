/**
 * COMPLIANCE MONITORING & ALERTING
 * Automated compliance monitoring for COPPA, FERPA, and GDPR
 * Real-time violation detection and reporting
 */
import { ServiceBusClient } from '@azure/service-bus';
import { OptimizedCosmosClient } from './cosmos-schema';
import { ComplianceReport, ComplianceViolation, DataBreachIncident } from './compliance-types';
export declare class ComplianceMonitor {
    private cosmosClient;
    private serviceBusClient;
    private requirements;
    private monitoringInterval;
    constructor(cosmosClient: OptimizedCosmosClient, serviceBusClient: ServiceBusClient);
    /**
     * Start automated compliance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop compliance monitoring
     */
    stopMonitoring(): void;
    /**
     * Run comprehensive compliance checks
     */
    runComplianceChecks(): Promise<any[]>;
    /**
     * Run real-time compliance checks (lighter weight)
     */
    private runRealtimeChecks;
    private checkCOPPACompliance;
    private checkFERPACompliance;
    private checkGDPRCompliance;
    private checkDataRetentionCompliance;
    private checkAccessControlCompliance;
    private checkAuditLoggingCompliance;
    private checkForDataBreaches;
    private checkAccessPatterns;
    private checkConsentExpiry;
    private checkHighRiskOperations;
    private reportViolation;
    private reportDataBreach;
    private generateComplianceReport;
    private generateRecommendations;
    private storeComplianceReport;
    private identifyViolations;
    private loadComplianceRequirements;
    private getUnderageAthletes;
    private checkExcessiveDataCollection;
    private getPendingDeletionRequests;
    private getMinorStudents;
    private checkParentalAccess;
    private checkCoachAccessRestrictions;
    private checkDataSharingCompliance;
    private getUsersWithoutValidConsent;
    private getTotalUserCount;
    private getPendingPortabilityRequests;
    private getPendingErasureRequests;
    private getOverdueBreachNotifications;
    private getAuditLogsBeyondRetention;
    private getPersonalDataBeyondRetention;
    private getUsersWithExcessivePrivileges;
    private getDormantAdminAccounts;
    private getUnauditedOperations;
    private checkAuditLogIntegrity;
    private detectSuspiciousAccess;
    private detectMassDataExports;
    private getExpiringConsents;
    private detectHighRiskOperations;
}
export declare class ComplianceAlerting {
    private monitor;
    constructor(monitor: ComplianceMonitor);
    /**
     * Send alerts for compliance violations
     */
    sendViolationAlert(violation: ComplianceViolation): Promise<void>;
    /**
     * Send data breach notifications
     */
    sendBreachNotification(breach: DataBreachIncident): Promise<void>;
    /**
     * Send compliance report notifications
     */
    sendComplianceReport(report: ComplianceReport): Promise<void>;
}
