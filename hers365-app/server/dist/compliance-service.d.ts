/**
 * COMPLIANCE SERVICE
 * Core service handling RBAC, data governance, and audit logging
 * Enterprise-grade compliance framework for regulated platform
 */
import express from 'express';
import { ServiceBusClient } from '@azure/service-bus';
import { OptimizedCosmosClient } from './cosmos-schema';
export declare class ComplianceService {
    private app;
    private cosmosClient;
    private serviceBusClient;
    private auditChain;
    constructor(cosmosClient: OptimizedCosmosClient, serviceBusClient: ServiceBusClient);
    private setupMiddleware;
    private setupRoutes;
    getApp(): express.Application;
    private rbacMiddleware;
    private getResourceFromPath;
    private checkPermission;
    private checkRolePermission;
    private getUserRoles;
    private requestDataExport;
    private requestDataDeletion;
    private validateDeletionRequest;
    private logAuditEvent;
    private healthCheck;
    private getRoles;
    private createRole;
    private updateRole;
    private deleteRole;
    private assignRole;
    private revokeRole;
    private getUserPermissions;
    private getExportStatus;
    private downloadExport;
    private getDeletionStatus;
    private recordConsent;
    private getConsentHistory;
    private revokeConsent;
    private getComplianceStatus;
    private getComplianceReports;
    private reportViolation;
    private getAuditLogs;
    private reportDataBreach;
    private runComplianceCheck;
    private generateComplianceReport;
}
