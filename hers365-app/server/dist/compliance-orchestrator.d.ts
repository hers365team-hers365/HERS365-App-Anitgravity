/**
 * COMPLIANCE & DATA GOVERNANCE ORCHESTRATOR
 * Main orchestrator for compliance services, data pipelines, and monitoring
 * Enterprise-grade compliance framework for regulated sports recruiting platform
 */
export declare class ComplianceOrchestrator {
    private cosmosClient;
    private serviceBusClient;
    private blobService;
    private complianceService;
    private exportPipeline;
    private deletionPipeline;
    private complianceMonitor;
    private complianceAlerting;
    private app;
    private eventReceivers;
    constructor();
    private setupConfiguration;
    private initializeComponents;
    private setupRoutes;
    private setupEventHandlers;
    private setupDataExportEventHandler;
    private setupDataDeletionEventHandler;
    private setupComplianceViolationHandler;
    /**
     * Start the compliance orchestrator
     */
    start(): Promise<void>;
    /**
     * Stop the compliance orchestrator
     */
    stop(): Promise<void>;
    /**
     * Get orchestrator status
     */
    getStatus(): any;
    /**
     * Manually trigger compliance check
     */
    runComplianceCheck(): Promise<any>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(reportType?: 'daily' | 'weekly' | 'monthly'): Promise<any>;
    /**
     * Get data processing statistics
     */
    getDataProcessingStats(): Promise<any>;
    /**
     * Emergency stop all data processing
     */
    emergencyStop(): Promise<void>;
}
export declare class ComplianceDashboard {
    private orchestrator;
    constructor(orchestrator: ComplianceOrchestrator);
    /**
     * Get compliance dashboard data
     */
    getDashboardData(): Promise<any>;
    private getActiveAlerts;
    private getComplianceRecommendations;
    /**
     * Export dashboard data for reporting
     */
    exportDashboardData(): Promise<any>;
}
export declare class ComplianceUtils {
    /**
     * Validate age for COPPA compliance
     */
    static isCOPPACompliant(age: number): boolean;
    /**
     * Calculate data retention period based on framework
     */
    static getRetentionPeriod(framework: 'COPPA' | 'FERPA' | 'GDPR', dataType: string): number;
    /**
     * Check if user requires parental consent
     */
    static requiresParentalConsent(userType: string, age?: number): boolean;
    /**
     * Validate data processing consent
     */
    static validateConsent(consent: any): boolean;
    /**
     * Generate compliance report summary
     */
    static generateComplianceSummary(metrics: any[]): any;
}
