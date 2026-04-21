/**
 * COMPLIANCE SERVICE
 * Core service handling RBAC, data governance, and audit logging
 * Enterprise-grade compliance framework for regulated platform
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from './logger';
import { eventPublisher } from './service-bus';
// ─── COMPLIANCE SERVICE CLASS ────────────────────────────────────────────────
export class ComplianceService {
    constructor(cosmosClient, serviceBusClient) {
        this.cosmosClient = cosmosClient;
        this.serviceBusClient = serviceBusClient;
        this.auditChain = new AuditChain();
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        // Correlation ID middleware
        this.app.use((req, res, next) => {
            const correlationId = req.headers['x-correlation-id'] ||
                req.headers['x-request-id'] ||
                uuidv4();
            req.correlationId = correlationId;
            res.setHeader('x-correlation-id', correlationId);
            next();
        });
        // RBAC middleware
        this.app.use('/api/*', this.rbacMiddleware.bind(this));
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', this.healthCheck.bind(this));
        // RBAC endpoints
        this.app.get('/api/roles', this.getRoles.bind(this));
        this.app.post('/api/roles', this.createRole.bind(this));
        this.app.put('/api/roles/:roleId', this.updateRole.bind(this));
        this.app.delete('/api/roles/:roleId', this.deleteRole.bind(this));
        this.app.post('/api/users/:userId/roles', this.assignRole.bind(this));
        this.app.delete('/api/users/:userId/roles/:roleId', this.revokeRole.bind(this));
        this.app.get('/api/users/:userId/permissions', this.getUserPermissions.bind(this));
        // Data governance endpoints
        this.app.post('/api/data/export', this.requestDataExport.bind(this));
        this.app.get('/api/data/export/:requestId', this.getExportStatus.bind(this));
        this.app.get('/api/data/export/:requestId/download', this.downloadExport.bind(this));
        this.app.post('/api/data/delete', this.requestDataDeletion.bind(this));
        this.app.get('/api/data/delete/:requestId', this.getDeletionStatus.bind(this));
        // Consent management
        this.app.post('/api/consent', this.recordConsent.bind(this));
        this.app.get('/api/consent/:userId', this.getConsentHistory.bind(this));
        this.app.delete('/api/consent/:consentId', this.revokeConsent.bind(this));
        // Compliance monitoring
        this.app.get('/api/compliance/status', this.getComplianceStatus.bind(this));
        this.app.get('/api/compliance/reports', this.getComplianceReports.bind(this));
        this.app.post('/api/compliance/violations', this.reportViolation.bind(this));
        // Audit endpoints
        this.app.get('/api/audit/logs', this.getAuditLogs.bind(this));
        this.app.post('/api/audit/breach', this.reportDataBreach.bind(this));
        // Admin endpoints
        this.app.post('/api/admin/compliance/check', this.runComplianceCheck.bind(this));
        this.app.post('/api/admin/compliance/report', this.generateComplianceReport.bind(this));
    }
    getApp() {
        return this.app;
    }
    // ─── RBAC MIDDLEWARE ───────────────────────────────────────────────────────
    async rbacMiddleware(req, res, next) {
        try {
            const userId = req.headers['x-user-id'];
            const userType = req.headers['x-user-type'];
            const action = `${req.method.toLowerCase()}_${this.getResourceFromPath(req.path)}`;
            if (!userId || !userType) {
                await this.logAuditEvent({
                    userId,
                    userType,
                    action: 'access_denied',
                    resource: req.path,
                    operation: 'read',
                    success: false,
                    errorMessage: 'Missing user authentication',
                    metadata: {
                        ipAddress: req.ip || 'unknown',
                        userAgent: req.headers['user-agent'] || 'unknown',
                        correlationId: req.correlationId,
                        complianceFlags: ['gdpr'],
                        sensitivity: 'internal',
                        retentionPeriod: 365
                    },
                    timestamp: new Date().toISOString()
                });
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const hasPermission = await this.checkPermission(userId, userType, req.path, action);
            if (!hasPermission) {
                await this.logAuditEvent({
                    userId,
                    userType,
                    action: 'access_denied',
                    resource: req.path,
                    operation: 'read',
                    success: false,
                    errorMessage: 'Insufficient permissions',
                    metadata: {
                        ipAddress: req.ip || 'unknown',
                        userAgent: req.headers['user-agent'] || 'unknown',
                        correlationId: req.correlationId,
                        complianceFlags: ['gdpr', userType === 'athlete' ? 'coppa' : undefined].filter(Boolean),
                        sensitivity: 'internal',
                        retentionPeriod: 365
                    },
                    timestamp: new Date().toISOString()
                });
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            // Log successful access
            await this.logAuditEvent({
                userId,
                userType,
                action: 'access_granted',
                resource: req.path,
                operation: 'read',
                success: true,
                metadata: {
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    correlationId: req.correlationId,
                    complianceFlags: [],
                    sensitivity: 'internal',
                    retentionPeriod: 30
                },
                timestamp: new Date().toISOString()
            });
            next();
        }
        catch (error) {
            logger.error('RBAC middleware error:', error);
            res.status(500).json({ error: 'Authorization error' });
        }
    }
    getResourceFromPath(path) {
        const segments = path.split('/').filter(s => s);
        if (segments.length >= 2) {
            return segments[1]; // e.g., 'roles', 'users', 'data'
        }
        return 'unknown';
    }
    // ─── RBAC IMPLEMENTATION ───────────────────────────────────────────────────
    async checkPermission(userId, userType, resource, action) {
        try {
            // Get user's active roles
            const roles = await this.getUserRoles(userId, userType);
            if (roles.length === 0)
                return false;
            // Check each role for the required permission
            for (const role of roles) {
                const hasPermission = this.checkRolePermission(role, resource, action);
                if (hasPermission)
                    return true;
            }
            return false;
        }
        catch (error) {
            logger.error('Permission check error:', error);
            return false;
        }
    }
    checkRolePermission(role, resource, action) {
        return role.permissions.some(permission => {
            if (permission.resource !== resource && permission.resource !== '*')
                return false;
            const actionAllowed = permission.actions.includes(action) ||
                permission.actions.includes('*') ||
                permission.actions.includes(action.split('_')[0] + '_*');
            if (!actionAllowed)
                return false;
            // Check conditions
            if (permission.conditions) {
                // Add specific condition checks here based on requirements
                // For example: age restrictions, location restrictions, etc.
            }
            return true;
        });
    }
    async getUserRoles(userId, userType) {
        const container = this.cosmosClient.getContainer('audit-logs'); // Store roles in audit-logs container for immutability
        const querySpec = {
            query: `
        SELECT r.role
        FROM r
        WHERE r.type = 'role_assignment'
          AND r.userId = @userId
          AND r.userType = @userType
          AND r.active = true
          AND (r.expiresAt = null OR r.expiresAt > GetCurrentDateTime())
      `,
            parameters: [
                { name: '@userId', value: userId },
                { name: '@userType', value: userType }
            ]
        };
        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources.map(r => r.role).filter(Boolean);
    }
    // ─── DATA GOVERNANCE IMPLEMENTATION ────────────────────────────────────────
    async requestDataExport(req, res) {
        try {
            const exportRequest = {
                userId: req.body.userId,
                userType: req.body.userType,
                requestType: req.body.requestType,
                complianceFramework: req.body.complianceFramework,
                requestedBy: req.headers['x-user-id'],
                dataScope: req.body.dataScope,
                formats: req.body.formats || ['json'],
                deliveryMethod: req.body.deliveryMethod || 'download',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            };
            const request = {
                ...exportRequest,
                id: uuidv4(),
                requestedAt: new Date().toISOString(),
                status: 'pending'
            };
            // Store request
            const container = this.cosmosClient.getContainer('audit-logs');
            await container.items.create({
                type: 'data_export_request',
                ...request,
                ttl: 30 * 24 * 60 * 60 // 30 days
            });
            // Publish event
            await eventPublisher.publish({
                id: uuidv4(),
                eventType: 'DataExportRequested',
                aggregateId: request.id,
                aggregateType: 'DataExportRequest',
                timestamp: new Date().toISOString(),
                correlationId: req.correlationId,
                userId: request.userId,
                userType: request.userType,
                source: 'compliance-service',
                version: 1,
                metadata: {
                    priority: 'high',
                    complianceFlags: [request.complianceFramework.toLowerCase()],
                    idempotencyKey: uuidv4()
                },
                payload: request
            });
            // Log audit event
            await this.logAuditEvent({
                userId: request.userId,
                userType: request.userType,
                action: 'data_export_requested',
                resource: 'user_data',
                operation: 'export',
                success: true,
                metadata: {
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    correlationId: req.correlationId,
                    complianceFlags: [request.complianceFramework.toLowerCase()],
                    requestId: request.id,
                    sensitivity: 'confidential',
                    retentionPeriod: 2555 // 7 years
                },
                timestamp: new Date().toISOString()
            });
            res.status(201).json({
                requestId: request.id,
                status: 'pending',
                estimatedCompletion: '24-48 hours'
            });
        }
        catch (error) {
            logger.error('Data export request error:', error);
            res.status(500).json({ error: 'Failed to create export request' });
        }
    }
    async requestDataDeletion(req, res) {
        try {
            const deletionRequest = {
                userId: req.body.userId,
                userType: req.body.userType,
                complianceFramework: req.body.complianceFramework,
                deletionType: req.body.deletionType,
                requestedBy: req.headers['x-user-id'],
                dataScope: req.body.dataScope,
                retentionPeriods: req.body.retentionPeriods || {
                    personalData: req.body.complianceFramework === 'COPPA' ? 0 : 2555, // COPPA immediate, FERPA 7 years
                    communications: 90,
                    financialData: 2555,
                    auditLogs: req.body.complianceFramework === 'GDPR' ? 0 : 2555
                }
            };
            // Validate deletion request based on framework
            const validationError = this.validateDeletionRequest(deletionRequest);
            if (validationError) {
                res.status(400).json({ error: validationError });
                return;
            }
            const request = {
                ...deletionRequest,
                id: uuidv4(),
                requestedAt: new Date().toISOString(),
                status: 'pending',
                auditTrail: []
            };
            // Store request
            const container = this.cosmosClient.getContainer('audit-logs');
            await container.items.create({
                type: 'data_deletion_request',
                ...request
            });
            // Publish event
            await eventPublisher.publish({
                id: uuidv4(),
                eventType: 'DataDeletionRequested',
                aggregateId: request.id,
                aggregateType: 'DataDeletionRequest',
                timestamp: new Date().toISOString(),
                correlationId: req.correlationId,
                userId: request.userId,
                userType: request.userType,
                source: 'compliance-service',
                version: 1,
                metadata: {
                    priority: 'critical',
                    complianceFlags: [request.complianceFramework.toLowerCase()],
                    idempotencyKey: uuidv4()
                },
                payload: request
            });
            // Log audit event
            await this.logAuditEvent({
                userId: request.userId,
                userType: request.userType,
                action: 'data_deletion_requested',
                resource: 'user_data',
                operation: 'delete',
                success: true,
                metadata: {
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    correlationId: req.correlationId,
                    complianceFlags: [request.complianceFramework.toLowerCase()],
                    deletionType: request.deletionType,
                    requestId: request.id,
                    sensitivity: 'confidential',
                    retentionPeriod: 2555
                },
                timestamp: new Date().toISOString()
            });
            res.status(201).json({
                requestId: request.id,
                status: 'pending',
                estimatedCompletion: request.deletionType === 'complete' ? '7-14 days' : '24-48 hours'
            });
        }
        catch (error) {
            logger.error('Data deletion request error:', error);
            res.status(500).json({ error: 'Failed to create deletion request' });
        }
    }
    validateDeletionRequest(request) {
        switch (request.complianceFramework) {
            case 'COPPA':
                if (request.userType !== 'athlete') {
                    return 'COPPA deletion requests are only valid for athletes';
                }
                if (request.deletionType === 'complete' && !request.dataScope.personalData) {
                    return 'COPPA requires complete personal data deletion';
                }
                break;
            case 'FERPA':
                if (!['athlete', 'parent'].includes(request.userType)) {
                    return 'FERPA deletion requests are only valid for athletes and parents';
                }
                break;
            case 'GDPR':
                // GDPR allows any data subject to request deletion
                break;
        }
        return null;
    }
    // ─── AUDIT LOGGING IMPLEMENTATION ──────────────────────────────────────────
    async logAuditEvent(event) {
        try {
            const eventId = uuidv4();
            const timestamp = event.timestamp || new Date().toISOString();
            // Get previous hash for chain
            const previousHash = await this.auditChain.getLatestHash();
            // Create event data
            const eventData = {
                ...event,
                id: eventId,
                eventId,
                timestamp,
                previousHash
            };
            // Calculate hash
            const hash = this.auditChain.calculateHash(eventData);
            const auditEvent = {
                ...eventData,
                hash
            };
            // Store in immutable audit log
            const container = this.cosmosClient.getContainer('audit-logs');
            await container.items.create({
                type: 'audit_event',
                partitionKey: this.auditChain.getPartitionKey(timestamp),
                ...auditEvent,
                ttl: (auditEvent.metadata.retentionPeriod || 365) * 24 * 60 * 60 // Default to 1 year if not specified
            });
            // Update chain
            this.auditChain.updateLatestHash(hash);
        }
        catch (error) {
            logger.error('Audit logging error:', error);
            // Audit logging failures are critical - should trigger alerts
            throw error;
        }
    }
    // ─── BASIC ROUTE IMPLEMENTATIONS ───────────────────────────────────────────
    async healthCheck(req, res) {
        res.json({
            status: 'healthy',
            service: 'compliance-service',
            timestamp: new Date().toISOString()
        });
    }
    async getRoles(req, res) {
        // Implementation for getting roles
        res.json({ roles: [] });
    }
    async createRole(req, res) {
        // Implementation for creating roles
        res.status(201).json({ roleId: uuidv4() });
    }
    async updateRole(req, res) {
        // Implementation for updating roles
        res.json({ success: true });
    }
    async deleteRole(req, res) {
        // Implementation for deleting roles
        res.json({ success: true });
    }
    async assignRole(req, res) {
        // Implementation for assigning roles
        res.json({ success: true });
    }
    async revokeRole(req, res) {
        // Implementation for revoking roles
        res.json({ success: true });
    }
    async getUserPermissions(req, res) {
        // Implementation for getting user permissions
        res.json({ permissions: [] });
    }
    async getExportStatus(req, res) {
        // Implementation for getting export status
        res.json({ status: 'pending' });
    }
    async downloadExport(req, res) {
        // Implementation for downloading export
        res.status(404).json({ error: 'Export not ready' });
    }
    async getDeletionStatus(req, res) {
        // Implementation for getting deletion status
        res.json({ status: 'pending' });
    }
    async recordConsent(req, res) {
        // Implementation for recording consent
        res.status(201).json({ consentId: uuidv4() });
    }
    async getConsentHistory(req, res) {
        // Implementation for getting consent history
        res.json({ consents: [] });
    }
    async revokeConsent(req, res) {
        // Implementation for revoking consent
        res.json({ success: true });
    }
    async getComplianceStatus(req, res) {
        // Implementation for getting compliance status
        res.json({ status: 'compliant' });
    }
    async getComplianceReports(req, res) {
        // Implementation for getting compliance reports
        res.json({ reports: [] });
    }
    async reportViolation(req, res) {
        // Implementation for reporting violations
        res.status(201).json({ violationId: uuidv4() });
    }
    async getAuditLogs(req, res) {
        // Implementation for getting audit logs
        res.json({ logs: [] });
    }
    async reportDataBreach(req, res) {
        // Implementation for reporting data breaches
        res.status(201).json({ incidentId: uuidv4() });
    }
    async runComplianceCheck(req, res) {
        // Implementation for running compliance checks
        res.json({ results: [] });
    }
    async generateComplianceReport(req, res) {
        // Implementation for generating compliance reports
        res.status(201).json({ reportId: uuidv4() });
    }
}
// ─── AUDIT CHAIN FOR IMMUTABILITY ────────────────────────────────────────────
class AuditChain {
    constructor() {
        this.latestHash = '';
    }
    calculateHash(data) {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }
    getLatestHash() {
        return this.latestHash;
    }
    updateLatestHash(hash) {
        this.latestHash = hash;
    }
    getPartitionKey(timestamp) {
        // Use date-based partitioning for audit logs
        const date = new Date(timestamp).toISOString().slice(0, 10);
        return `audit_${date}_001`; // Simplified - would use hash in production
    }
    async verifyChainIntegrity(container, startDate, endDate) {
        // Implementation to verify the hash chain integrity
        // This would check that each event's previousHash matches the previous event's hash
        return true; // Placeholder
    }
}
// ─── EXPORT SERVICE ──────────────────────────────────────────────────────────
//# sourceMappingURL=compliance-service.js.map