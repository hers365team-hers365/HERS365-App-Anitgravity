/**
 * COMPREHENSIVE OBSERVABILITY AND COMPLIANCE REPORTING
 * Enterprise-grade monitoring, alerting, and compliance for authentication system
 */
import * as auth from './auth';
import { monitoring } from './scaling';
// ─── COMPLIANCE REPORTING ─────────────────────────────────────────────────────
/**
 * GDPR Compliance Reporting
 */
export class GDPRComplianceReporter {
    /**
     * Generate GDPR Article 32 Security Report
     */
    async generateSecurityReport(timeRangeDays = 90) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));
        // Get security metrics
        const metrics = await auth.getSecurityMetrics(timeRangeDays * 24);
        // Get audit logs for compliance events
        const gdprLogs = await auth.getAuditLogs({
            complianceFlags: ['gdpr'],
            fromDate: startDate,
            toDate: endDate
        });
        // Analyze data processing activities
        const dataProcessingStats = {
            totalDataSubjects: await this.getUniqueDataSubjects(startDate, endDate),
            dataProcessingOperations: gdprLogs.length,
            consentWithdrawals: gdprLogs.filter(log => log.action.includes('delete') || log.action.includes('withdraw')).length,
            dataBreachIncidents: await this.getDataBreachIncidents(startDate, endDate),
            crossBorderTransfers: gdprLogs.filter(log => log.metadata?.crossBorder === true).length
        };
        return {
            reportPeriod: { startDate, endDate },
            securityMeasures: {
                encryptionAtRest: true,
                encryptionInTransit: true,
                accessControls: true,
                auditLogging: true,
                incidentResponse: true
            },
            securityMetrics: metrics,
            dataProcessingStats,
            complianceStatus: this.assessGDPRCompliance(metrics, dataProcessingStats),
            recommendations: this.generateGDPRRecommendations(metrics, dataProcessingStats)
        };
    }
    /**
     * Generate COPPA Compliance Report
     */
    async generateCOPPAReport(timeRangeDays = 90) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));
        // Get COPPA-related audit logs
        const coppaLogs = await auth.getAuditLogs({
            complianceFlags: ['coppa'],
            fromDate: startDate,
            toDate: endDate
        });
        // Analyze parental consent and minor data handling
        const coppaStats = {
            parentalConsents: coppaLogs.filter(log => log.action.includes('consent') || log.action.includes('parent')).length,
            minorDataAccess: coppaLogs.filter(log => log.metadata?.minorData === true).length,
            dataDeletionRequests: coppaLogs.filter(log => log.action.includes('delete') && log.metadata?.minor === true).length,
            ageVerificationEvents: coppaLogs.filter(log => log.action.includes('age_verify')).length,
            privacyNoticeViews: coppaLogs.filter(log => log.action.includes('privacy_notice')).length
        };
        return {
            reportPeriod: { startDate, endDate },
            coppaCompliance: {
                verifiableParentalConsent: coppaStats.parentalConsents > 0,
                dataMinimization: true, // Implemented by design
                rightToDeletion: coppaStats.dataDeletionRequests > 0,
                privacyNotices: coppaStats.privacyNoticeViews > 0,
                ageVerification: coppaStats.ageVerificationEvents > 0
            },
            statistics: coppaStats,
            complianceStatus: this.assessCOPPACompliance(coppaStats),
            recommendations: this.generateCOPPARecommendations(coppaStats)
        };
    }
    /**
     * Generate FERPA Compliance Report
     */
    async generateFERPAReport(timeRangeDays = 90) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));
        const ferpaLogs = await auth.getAuditLogs({
            complianceFlags: ['ferpa'],
            fromDate: startDate,
            toDate: endDate
        });
        const ferpaStats = {
            educationalRecordAccess: ferpaLogs.filter(log => log.action.includes('education_record')).length,
            parentalAccess: ferpaLogs.filter(log => log.metadata?.parentAccess === true).length,
            unauthorizedAccess: ferpaLogs.filter(log => log.action.includes('unauthorized') && log.metadata?.educationRecord === true).length,
            dataSharing: ferpaLogs.filter(log => log.action.includes('share') && log.metadata?.educationRecord === true).length
        };
        return {
            reportPeriod: { startDate, endDate },
            ferpaCompliance: {
                parentalRights: ferpaStats.parentalAccess > 0,
                dataSecurity: ferpaStats.unauthorizedAccess === 0,
                accessControls: true,
                auditLogging: ferpaStats.educationalRecordAccess > 0
            },
            statistics: ferpaStats,
            complianceStatus: this.assessFERPACompliance(ferpaStats),
            recommendations: this.generateFERPARecommendations(ferpaStats)
        };
    }
    async getUniqueDataSubjects(startDate, endDate) {
        // This would query the database for unique user IDs in audit logs
        // For now, return an estimate based on audit logs
        const logs = await auth.getAuditLogs({ fromDate: startDate, toDate: endDate });
        const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean));
        return uniqueUsers.size;
    }
    async getDataBreachIncidents(startDate, endDate) {
        // Check for security alerts indicating potential breaches
        const alerts = await auth.getAuditLogs({
            action: 'security_alert',
            fromDate: startDate,
            toDate: endDate
        });
        return alerts.filter(log => log.metadata?.severity === 'critical' || log.metadata?.breach === true).length;
    }
    assessGDPRCompliance(metrics, stats) {
        if (metrics.failedLogins > 100 || stats.dataBreachIncidents > 0) {
            return 'needs_review';
        }
        return 'compliant';
    }
    assessCOPPACompliance(stats) {
        if (stats.parentalConsents === 0 || stats.dataDeletionRequests === 0) {
            return 'needs_review';
        }
        return 'compliant';
    }
    assessFERPACompliance(stats) {
        if (stats.unauthorizedAccess > 0) {
            return 'needs_review';
        }
        return 'compliant';
    }
    generateGDPRRecommendations(metrics, stats) {
        const recommendations = [];
        if (metrics.failedLogins > 50) {
            recommendations.push('Review and strengthen brute force protection measures');
        }
        if (stats.dataBreachIncidents > 0) {
            recommendations.push('Conduct thorough security incident investigation');
        }
        if (metrics.login_success_rate < 95) {
            recommendations.push('Improve authentication success rates and user experience');
        }
        return recommendations;
    }
    generateCOPPARecommendations(stats) {
        const recommendations = [];
        if (stats.parentalConsents === 0) {
            recommendations.push('Implement parental consent verification system');
        }
        if (stats.dataDeletionRequests === 0) {
            recommendations.push('Ensure COPPA right to deletion is properly implemented');
        }
        if (stats.privacyNoticeViews === 0) {
            recommendations.push('Implement privacy notice tracking for parents');
        }
        return recommendations;
    }
    generateFERPARecommendations(stats) {
        const recommendations = [];
        if (stats.unauthorizedAccess > 0) {
            recommendations.push('Strengthen access controls for educational records');
        }
        if (stats.parentalAccess === 0) {
            recommendations.push('Ensure parental access rights are properly implemented');
        }
        return recommendations;
    }
}
// ─── REAL-TIME MONITORING AND ALERTING ────────────────────────────────────────
/**
 * Real-time security monitoring and alerting
 */
export class SecurityMonitoringService {
    constructor() {
        this.alertThresholds = new Map();
        this.activeAlerts = new Map();
        this.initializeAlertThresholds();
        this.startMonitoringLoop();
    }
    static getInstance() {
        if (!SecurityMonitoringService.instance) {
            SecurityMonitoringService.instance = new SecurityMonitoringService();
        }
        return SecurityMonitoringService.instance;
    }
    initializeAlertThresholds() {
        this.alertThresholds.set('failed_login_rate', 10); // 10 failed logins per minute
        this.alertThresholds.set('brute_force_attempts', 5); // 5+ brute force attempts
        this.alertThresholds.set('account_lockouts', 3); // 3+ account lockouts per hour
        this.alertThresholds.set('unusual_location_logins', 2); // 2+ logins from unusual locations
        this.alertThresholds.set('mfa_bypass_attempts', 1); // Any MFA bypass attempts
        this.alertThresholds.set('suspicious_ip_activity', 10); // 10+ suspicious activities from single IP
    }
    /**
     * Check for security alerts and trigger notifications
     */
    async checkForAlerts() {
        const metrics = monitoring.getMetrics();
        // Check failed login rate (per minute)
        const failedLoginRate = metrics.login_attempts_failed / 60;
        if (failedLoginRate > this.alertThresholds.get('failed_login_rate')) {
            await this.triggerAlert('high_failed_login_rate', {
                severity: 'high',
                message: `High failed login rate detected: ${failedLoginRate.toFixed(2)} per minute`,
                metrics: { failedLoginRate }
            });
        }
        // Check brute force attempts
        if (metrics.brute_force_attempts > this.alertThresholds.get('brute_force_attempts')) {
            await this.triggerAlert('brute_force_detected', {
                severity: 'critical',
                message: `Brute force attempts detected: ${metrics.brute_force_attempts}`,
                metrics: { bruteForceAttempts: metrics.brute_force_attempts }
            });
        }
        // Check account lockouts
        if (metrics.account_lockouts > this.alertThresholds.get('account_lockouts')) {
            await this.triggerAlert('high_account_lockouts', {
                severity: 'medium',
                message: `High account lockout rate: ${metrics.account_lockouts} per hour`,
                metrics: { accountLockouts: metrics.account_lockouts }
            });
        }
        // Check cache performance
        if (metrics.cache_hit_rate < 80) {
            await this.triggerAlert('low_cache_performance', {
                severity: 'medium',
                message: `Low cache hit rate: ${metrics.cache_hit_rate.toFixed(2)}%`,
                metrics: { cacheHitRate: metrics.cache_hit_rate }
            });
        }
        // Check for unusual patterns in audit logs
        await this.checkAuditLogPatterns();
    }
    /**
     * Check for suspicious patterns in audit logs
     */
    async checkAuditLogPatterns() {
        const recentLogs = await auth.getAuditLogs({
            limit: 100,
            fromDate: new Date(Date.now() - (5 * 60 * 1000)) // Last 5 minutes
        });
        // Check for rapid login failures from same IP
        const ipFailureCount = new Map();
        for (const log of recentLogs) {
            if (log.success === false && log.action === 'login' && log.ipAddress) {
                ipFailureCount.set(log.ipAddress, (ipFailureCount.get(log.ipAddress) || 0) + 1);
            }
        }
        for (const [ip, count] of ipFailureCount.entries()) {
            if (count > 5) {
                await this.triggerAlert('suspicious_ip_activity', {
                    severity: 'high',
                    message: `Suspicious activity from IP ${ip}: ${count} failed logins in 5 minutes`,
                    metrics: { ip, failureCount: count }
                });
            }
        }
        // Check for account enumeration attempts
        const userNotFoundLogs = recentLogs.filter(log => log.success === false && log.metadata?.reason === 'user_not_found');
        if (userNotFoundLogs.length > 10) {
            await this.triggerAlert('account_enumeration_attempt', {
                severity: 'medium',
                message: `Potential account enumeration: ${userNotFoundLogs.length} user_not_found errors`,
                metrics: { userNotFoundCount: userNotFoundLogs.length }
            });
        }
    }
    /**
     * Trigger security alert
     */
    async triggerAlert(alertType, alertData) {
        const alertId = `${alertType}_${Date.now()}`;
        // Store active alert
        this.activeAlerts.set(alertId, {
            ...alertData,
            alertId,
            triggeredAt: new Date(),
            resolved: false
        });
        // Log the alert
        await auth.logAuditEvent({
            action: 'security_alert_triggered',
            success: true,
            metadata: { alertType, ...alertData }
        });
        // In production, this would send notifications via email, Slack, PagerDuty, etc.
        console.error(`🚨 SECURITY ALERT: ${alertData.message}`);
        // Auto-resolve certain alerts after timeout
        if (alertData.severity === 'low' || alertData.severity === 'medium') {
            setTimeout(() => {
                this.resolveAlert(alertId);
            }, 30 * 60 * 1000); // 30 minutes
        }
    }
    /**
     * Resolve security alert
     */
    async resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            await auth.logAuditEvent({
                action: 'security_alert_resolved',
                success: true,
                metadata: { alertId, alertType: alert.alertType }
            });
            this.activeAlerts.delete(alertId);
        }
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
    }
    /**
     * Start monitoring loop
     */
    startMonitoringLoop() {
        // Check for alerts every 30 seconds
        setInterval(async () => {
            try {
                await this.checkForAlerts();
            }
            catch (error) {
                console.error('Error in security monitoring loop:', error);
            }
        }, 30000);
        // Cleanup resolved alerts every hour
        setInterval(() => {
            for (const [alertId, alert] of this.activeAlerts.entries()) {
                if (alert.resolved && Date.now() - alert.resolvedAt.getTime() > 24 * 60 * 60 * 1000) {
                    this.activeAlerts.delete(alertId);
                }
            }
        }, 60 * 60 * 1000);
    }
}
// ─── PERFORMANCE MONITORING ───────────────────────────────────────────────────
/**
 * Performance monitoring for authentication system
 */
export class PerformanceMonitoringService {
    constructor() {
        this.responseTimes = new Map();
        this.initializeEndpoints();
    }
    static getInstance() {
        if (!PerformanceMonitoringService.instance) {
            PerformanceMonitoringService.instance = new PerformanceMonitoringService();
        }
        return PerformanceMonitoringService.instance;
    }
    initializeEndpoints() {
        const endpoints = [
            'login', 'register', 'token_refresh', 'mfa_verify',
            'session_get', 'session_revoke', 'logout'
        ];
        for (const endpoint of endpoints) {
            this.responseTimes.set(endpoint, []);
        }
    }
    /**
     * Record endpoint response time
     */
    recordResponseTime(endpoint, responseTime) {
        const times = this.responseTimes.get(endpoint) || [];
        times.push(responseTime);
        // Keep only last 1000 measurements
        if (times.length > 1000) {
            times.shift();
        }
        this.responseTimes.set(endpoint, times);
    }
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const stats = {};
        for (const [endpoint, times] of this.responseTimes.entries()) {
            if (times.length === 0)
                continue;
            const sorted = [...times].sort((a, b) => a - b);
            stats[endpoint] = {
                count: sorted.length,
                avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)],
                max: Math.max(...sorted),
                min: Math.min(...sorted)
            };
        }
        return stats;
    }
    /**
     * Check performance thresholds
     */
    checkPerformanceThresholds() {
        const stats = this.getPerformanceStats();
        const violations = [];
        const thresholds = {
            login: { p95: 2000, p99: 5000 }, // 2s p95, 5s p99
            register: { p95: 3000, p99: 8000 },
            token_refresh: { p95: 1000, p99: 3000 },
            mfa_verify: { p95: 1500, p99: 4000 }
        };
        for (const [endpoint, threshold] of Object.entries(thresholds)) {
            const endpointStats = stats[endpoint];
            if (!endpointStats)
                continue;
            if (endpointStats.p95 > threshold.p95) {
                violations.push({
                    endpoint,
                    metric: 'p95',
                    value: endpointStats.p95,
                    threshold: threshold.p95
                });
            }
            if (endpointStats.p99 > threshold.p99) {
                violations.push({
                    endpoint,
                    metric: 'p99',
                    value: endpointStats.p99,
                    threshold: threshold.p99
                });
            }
        }
        let overall = 'good';
        if (violations.some(v => v.metric === 'p99')) {
            overall = 'critical';
        }
        else if (violations.length > 0) {
            overall = 'warning';
        }
        return { violations, overall };
    }
}
// ─── DASHBOARD AND REPORTING ──────────────────────────────────────────────────
/**
 * Security dashboard data provider
 */
export class SecurityDashboardService {
    constructor() { }
    static getInstance() {
        if (!SecurityDashboardService.instance) {
            SecurityDashboardService.instance = new SecurityDashboardService();
        }
        return SecurityDashboardService.instance;
    }
    /**
     * Get dashboard data
     */
    async getDashboardData(timeRangeHours = 24) {
        const [metrics, healthStatus, activeAlerts, performanceStats, scalingRecommendation, complianceReports] = await Promise.all([
            monitoring.getMetrics(),
            monitoring.getHealthStatus(),
            SecurityMonitoringService.getInstance().getActiveAlerts(),
            PerformanceMonitoringService.getInstance().getPerformanceStats(),
            (await import('./scaling')).autoScaling.getScalingRecommendation(),
            this.getComplianceSummary()
        ]);
        return {
            timestamp: new Date(),
            timeRange: `${timeRangeHours} hours`,
            systemHealth: healthStatus,
            securityMetrics: {
                ...metrics,
                activeAlerts: activeAlerts.length,
                performanceStatus: PerformanceMonitoringService.getInstance().checkPerformanceThresholds()
            },
            activeAlerts,
            performanceStats,
            scalingRecommendation,
            complianceReports,
            recommendations: this.generateDashboardRecommendations(metrics, healthStatus, activeAlerts)
        };
    }
    /**
     * Get compliance summary
     */
    async getComplianceSummary() {
        const reporter = new GDPRComplianceReporter();
        const [gdpr, coppa, ferpa] = await Promise.all([
            reporter.generateGDPRSecurityReport(30),
            reporter.generateCOPPAReport(30),
            reporter.generateFERPAReport(30)
        ]);
        return {
            gdpr: {
                status: gdpr.complianceStatus,
                lastChecked: new Date(),
                criticalIssues: gdpr.recommendations.length
            },
            coppa: {
                status: coppa.complianceStatus,
                lastChecked: new Date(),
                criticalIssues: coppa.recommendations.length
            },
            ferpa: {
                status: ferpa.complianceStatus,
                lastChecked: new Date(),
                criticalIssues: ferpa.recommendations.length
            }
        };
    }
    /**
     * Generate dashboard recommendations
     */
    generateDashboardRecommendations(metrics, healthStatus, activeAlerts) {
        const recommendations = [];
        if (healthStatus.status !== 'healthy') {
            recommendations.push(`System health is ${healthStatus.status}. Review system checks.`);
        }
        if (activeAlerts.length > 0) {
            recommendations.push(`${activeAlerts.length} active security alerts require attention.`);
        }
        if (metrics.cache_hit_rate < 85) {
            recommendations.push('Cache hit rate is low. Consider increasing cache size or optimizing cache strategy.');
        }
        if (metrics.login_attempts_failed > metrics.login_attempts_success) {
            recommendations.push('Failed login attempts exceed successful ones. Review authentication policies.');
        }
        return recommendations;
    }
}
// ─── EXPORT SERVICES ──────────────────────────────────────────────────────────
export const gdprReporter = new GDPRComplianceReporter();
export const securityMonitoring = SecurityMonitoringService.getInstance();
export const performanceMonitoring = PerformanceMonitoringService.getInstance();
export const securityDashboard = SecurityDashboardService.getInstance();
//# sourceMappingURL=observability.js.map