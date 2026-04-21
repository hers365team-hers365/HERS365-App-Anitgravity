/**
 * COMPREHENSIVE OBSERVABILITY AND COMPLIANCE REPORTING
 * Enterprise-grade monitoring, alerting, and compliance for authentication system
 */
/**
 * GDPR Compliance Reporting
 */
export declare class GDPRComplianceReporter {
    /**
     * Generate GDPR Article 32 Security Report
     */
    generateSecurityReport(timeRangeDays?: number): Promise<any>;
    /**
     * Generate COPPA Compliance Report
     */
    generateCOPPAReport(timeRangeDays?: number): Promise<any>;
    /**
     * Generate FERPA Compliance Report
     */
    generateFERPAReport(timeRangeDays?: number): Promise<any>;
    private getUniqueDataSubjects;
    private getDataBreachIncidents;
    private assessGDPRCompliance;
    private assessCOPPACompliance;
    private assessFERPACompliance;
    private generateGDPRRecommendations;
    private generateCOPPARecommendations;
    private generateFERPARecommendations;
}
/**
 * Real-time security monitoring and alerting
 */
export declare class SecurityMonitoringService {
    private static instance;
    private alertThresholds;
    private activeAlerts;
    private constructor();
    static getInstance(): SecurityMonitoringService;
    private initializeAlertThresholds;
    /**
     * Check for security alerts and trigger notifications
     */
    private checkForAlerts;
    /**
     * Check for suspicious patterns in audit logs
     */
    private checkAuditLogPatterns;
    /**
     * Trigger security alert
     */
    private triggerAlert;
    /**
     * Resolve security alert
     */
    resolveAlert(alertId: string): Promise<void>;
    /**
     * Get active alerts
     */
    getActiveAlerts(): any[];
    /**
     * Start monitoring loop
     */
    private startMonitoringLoop;
}
/**
 * Performance monitoring for authentication system
 */
export declare class PerformanceMonitoringService {
    private static instance;
    private responseTimes;
    private constructor();
    static getInstance(): PerformanceMonitoringService;
    private initializeEndpoints;
    /**
     * Record endpoint response time
     */
    recordResponseTime(endpoint: string, responseTime: number): void;
    /**
     * Get performance statistics
     */
    getPerformanceStats(): Record<string, any>;
    /**
     * Check performance thresholds
     */
    checkPerformanceThresholds(): {
        violations: Array<{
            endpoint: string;
            metric: string;
            value: number;
            threshold: number;
        }>;
        overall: 'good' | 'warning' | 'critical';
    };
}
/**
 * Security dashboard data provider
 */
export declare class SecurityDashboardService {
    private static instance;
    private constructor();
    static getInstance(): SecurityDashboardService;
    /**
     * Get dashboard data
     */
    getDashboardData(timeRangeHours?: number): Promise<any>;
    /**
     * Get compliance summary
     */
    private getComplianceSummary;
    /**
     * Generate dashboard recommendations
     */
    private generateDashboardRecommendations;
}
export declare const gdprReporter: GDPRComplianceReporter;
export declare const securityMonitoring: SecurityMonitoringService;
export declare const performanceMonitoring: PerformanceMonitoringService;
export declare const securityDashboard: SecurityDashboardService;
