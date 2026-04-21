/**
 * COSMOS DB INTEGRATION SERVICE
 * High-performance API layer for social recruiting platform
 * Sub-200ms latency optimization with enterprise-scale caching
 */
import express from 'express';
export declare class CosmosAPIService {
    private app;
    private cosmosClient;
    private repositories;
    private cacheManager;
    private cacheAside;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    /**
     * Initialize with Cosmos DB and caching
     */
    initialize(): Promise<void>;
    private healthCheck;
    private getUser;
    private updateUser;
    private getUserPosts;
    private createPost;
    private getPostsByHashtag;
    private updatePostEngagement;
    private getConversationMessages;
    private sendMessage;
    private markMessagesRead;
    private getUnreadCount;
    private searchAthletes;
    private getAnalytics;
    private getComplianceAudit;
    private getSecurityIncidents;
    getApp(): express.Application;
    getPerformanceMetrics(): Promise<any>;
    close(): Promise<void>;
}
/**
 * Query result caching decorator
 */
export declare function cached(ttl?: number): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Batch operation optimizer
 */
export declare class BatchOptimizer {
    private operations;
    private batchSize;
    constructor(batchSize?: number);
    add(operation: Function, ...args: any[]): void;
    execute(): Promise<any[]>;
}
