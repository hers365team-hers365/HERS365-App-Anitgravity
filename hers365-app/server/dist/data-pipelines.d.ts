/**
 * DATA GOVERNANCE PIPELINES
 * Enterprise-grade data export and deletion pipelines
 * Handles compliance requirements for COPPA, FERPA, and GDPR
 */
import { ServiceBusClient } from '@azure/service-bus';
import { BlobServiceClient } from '@azure/storage-blob';
import { OptimizedCosmosClient } from './cosmos-schema';
import { DataExportRequest, DataDeletionRequest } from './compliance-types';
export declare class DataExportPipeline {
    private cosmosClient;
    private blobService;
    private serviceBusClient;
    constructor(cosmosClient: OptimizedCosmosClient, blobService: BlobServiceClient, serviceBusClient: ServiceBusClient);
    /**
     * Process data export request
     */
    processExportRequest(request: DataExportRequest): Promise<void>;
    private collectUserData;
    private getUserPersonalData;
    private getUserCommunications;
    private getUserFinancialData;
    private getUserAuditLogs;
    private generateExportFiles;
    private generateFile;
    private writeJsonFile;
    private writeCsvFile;
    private writePdfFile;
    private uploadExportFiles;
    private updateExportStatus;
    private completeExportRequest;
    private getAthleteProfiles;
    private getAthleteRankings;
    private getParentChildren;
    private getCoachRecruitingData;
    private anonymizeContent;
}
export declare class DataDeletionPipeline {
    private cosmosClient;
    private serviceBusClient;
    constructor(cosmosClient: OptimizedCosmosClient, serviceBusClient: ServiceBusClient);
    /**
     * Process data deletion request
     */
    processDeletionRequest(request: DataDeletionRequest): Promise<void>;
    private executeDeletion;
    private executeCompleteDeletion;
    private executePartialDeletion;
    private executeAnonymization;
    private deletePersonalData;
    private deleteCommunications;
    private deleteFinancialData;
    private anonymizeAuditLogs;
    private anonymizeUserData;
    private updateDeletionStatus;
    private completeDeletionRequest;
}
