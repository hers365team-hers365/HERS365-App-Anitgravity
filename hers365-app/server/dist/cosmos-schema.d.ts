/**
 * COSMOS DB SCHEMA DESIGN
 * Enterprise-grade schema for high-traffic social recruiting platform
 * Optimized for sub-200ms latency, 50K+ concurrent users, and compliance
 */
import { Container } from '@azure/cosmos';
export interface CosmosDBConfig {
    endpoint: string;
    key: string;
    databaseName: string;
    containers: ContainerConfig[];
    throughput: {
        database?: number;
        containers: {
            [containerName: string]: number;
        };
    };
}
export interface ContainerConfig {
    name: string;
    partitionKey: string | string[];
    defaultTtl?: number;
    indexingPolicy?: {
        includedPaths?: string[];
        excludedPaths?: string[];
        compositeIndexes?: Array<Array<{
            path: string;
            order: 'ascending' | 'descending';
        }>>;
        spatialIndexes?: Array<{
            path: string;
            types: string[];
        }>;
    };
    uniqueKeyPolicy?: {
        uniqueKeys: string[][];
    };
    conflictResolutionPolicy?: {
        mode: 'LastWriterWins' | 'Custom';
        conflictResolutionPath?: string;
        conflictResolutionProcedure?: string;
    };
    changeFeedPolicy?: {
        retentionDuration?: number;
        startFromBeginning?: boolean;
    };
}
export declare const COSMOS_SCHEMA: CosmosDBConfig;
/**
 * SYNTHETIC PARTITION KEY GENERATOR
 * Creates evenly distributed partition keys to prevent hot partitions
 */
export declare class PartitionKeyGenerator {
    private static readonly PARTITION_COUNT;
    /**
     * Generate synthetic partition key for users
     * Uses hash of userId to distribute across partitions evenly
     */
    static forUser(userId: string): string;
    /**
     * Generate time-based partition key for posts
     * Combines date with hash for even distribution
     */
    static forPost(authorId: string, createdAt: Date): string;
    /**
     * Generate conversation-based partition key for messages
     * Groups messages by conversation for efficient querying
     */
    static forMessage(conversationId: string): string;
    /**
     * Generate date-based partition key for audit logs
     * Groups logs by date for compliance and retention
     */
    static forAuditLog(timestamp: Date, complianceType: string): string;
    /**
     * Generate hash-based partition key for search index
     * Distributes search data evenly across partitions
     */
    static forSearchIndex(entityId: string): string;
    /**
     * Generate time-bucket partition key for analytics
     * Groups metrics by time periods for efficient aggregation
     */
    static forAnalytics(timeBucket: string, metricType: string): string;
    /**
     * Generate cache partition key
     * Distributes cache entries evenly
     */
    static forCache(cacheKey: string): string;
    /**
     * Generate aggregate-based partition key for events
     * Groups events by aggregate for event sourcing
     */
    static forEvent(aggregateId: string): string;
    /**
     * Simple hash function for partition key generation
     */
    private static simpleHash;
}
/**
 * QUERY PATTERNS FOR SUB-200MS LATENCY
 * Pre-defined query templates optimized for Cosmos DB
 */
export declare class QueryPatterns {
    private container;
    constructor(container: Container);
    /**
     * Get user by ID - Point read for sub-50ms latency
     */
    getUserById(userId: string): Promise<any>;
    /**
     * Get user by email - Optimized with composite index
     */
    getUserByEmail(email: string, userType: string): Promise<any>;
    /**
     * Get user inbox messages
     */
    getUserInbox(userId: string, since?: Date, pageSize?: number): Promise<any[]>;
    /**
     * Get user's posts feed - Paginated for performance
     */
    getUserPosts(authorId: string, continuationToken?: string, pageSize?: number): Promise<any>;
    /**
     * Get posts by hashtag - Uses composite index
     */
    getPostsByHashtag(hashtag: string, continuationToken?: string, pageSize?: number): Promise<any>;
    /**
     * Get conversation messages - Partitioned for speed
     */
    getConversationMessages(conversationId: string, since?: Date, pageSize?: number): Promise<any>;
    /**
     * Get user's unread messages count - Optimized aggregation
     */
    getUnreadMessagesCount(userId: string): Promise<number>;
    /**
     * Search athletes by criteria - Uses search index
     */
    searchAthletes(filters: {
        sport?: string;
        state?: string;
        graduationYear?: number;
        ranking?: {
            min: number;
            max: number;
        };
    }, pageSize?: number): Promise<any>;
    /**
     * Get user engagement metrics - Time-bucketed for performance
     */
    getUserEngagementMetrics(timeBucket: string, userType?: string): Promise<any>;
    /**
     * Get compliance audit trail - Date-partitioned
     */
    getComplianceAuditTrail(userId: string, complianceType: string, fromDate: Date, toDate: Date): Promise<any>;
}
/**
 * STORED PROCEDURE: BULK USER IMPORT
 * Optimized for high-volume user creation with validation
 */
export declare const BULK_USER_IMPORT_PROCEDURE = "\nfunction bulkImportUsers(users) {\n    const context = getContext();\n    const collection = context.getCollection();\n    const response = context.getResponse();\n\n    let processed = 0;\n    let errors = [];\n\n    function processNext() {\n        if (processed >= users.length) {\n            response.setBody({\n                processed: processed,\n                errors: errors,\n                success: errors.length === 0\n            });\n            return;\n        }\n\n        const user = users[processed];\n\n        // Validate user data\n        if (!user.email || !user.userType) {\n            errors.push({\n                index: processed,\n                error: 'Missing required fields',\n                user: user\n            });\n            processed++;\n            processNext();\n            return;\n        }\n\n        // Generate partition key\n        const partitionKey = 'user_' + (Math.abs(hashCode(user.userId || user.email)) % 400).toString().padStart(3, '0');\n\n        // Check for existing user\n        const query = {\n            query: 'SELECT * FROM c WHERE c.email = @email',\n            parameters: [{ name: '@email', value: user.email }]\n        };\n\n        collection.queryDocuments(collection.getSelfLink(), query, {}, function(err, documents) {\n            if (err) {\n                errors.push({\n                    index: processed,\n                    error: 'Query failed: ' + err.message,\n                    user: user\n                });\n                processed++;\n                processNext();\n                return;\n            }\n\n            if (documents.length > 0) {\n                errors.push({\n                    index: processed,\n                    error: 'User already exists',\n                    user: user\n                });\n                processed++;\n                processNext();\n                return;\n            }\n\n            // Create user document\n            const userDoc = {\n                id: user.userId || generateId(),\n                userId: user.userId || generateId(),\n                partitionKey: partitionKey,\n                email: user.email,\n                userType: user.userType,\n                name: user.name,\n                createdAt: new Date().toISOString(),\n                verificationStatus: 'pending',\n                ...user\n            };\n\n            collection.createDocument(collection.getSelfLink(), userDoc, {}, function(createErr) {\n                if (createErr) {\n                    errors.push({\n                        index: processed,\n                        error: 'Create failed: ' + createErr.message,\n                        user: user\n                    });\n                }\n                processed++;\n                processNext();\n            });\n        });\n    }\n\n    processNext();\n}\n\nfunction hashCode(str) {\n    let hash = 0;\n    for (let i = 0; i < str.length; i++) {\n        const char = str.charCodeAt(i);\n        hash = ((hash << 5) - hash) + char;\n        hash = hash & hash;\n    }\n    return hash;\n}\n\nfunction generateId() {\n    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {\n        const r = Math.random() * 16 | 0;\n        const v = c === 'x' ? r : (r & 0x3 | 0x8);\n        return v.toString(16);\n    });\n}\n";
/**
 * STORED PROCEDURE: REAL-TIME FEED UPDATE
 * Updates user feeds when new posts are created
 */
export declare const UPDATE_FEED_PROCEDURE = "\nfunction updateUserFeeds(post) {\n    const context = getContext();\n    const collection = context.getCollection();\n    const response = context.getResponse();\n\n    // Get users who should see this post (followers, etc.)\n    const feedQuery = {\n        query: 'SELECT c.userId FROM c WHERE c.entityType = \"feed\" AND ARRAY_CONTAINS(c.sources, @authorId)',\n        parameters: [{ name: '@authorId', value: post.authorId }]\n    };\n\n    collection.queryDocuments(collection.getSelfLink(), feedQuery, {}, function(err, feeds) {\n        if (err) {\n            response.setBody({ success: false, error: err.message });\n            return;\n        }\n\n        let updated = 0;\n        const total = feeds.length;\n\n        function updateNext() {\n            if (updated >= total) {\n                response.setBody({ success: true, updated: updated });\n                return;\n            }\n\n            const feed = feeds[updated];\n            const feedUpdate = {\n                postId: post.id,\n                authorId: post.authorId,\n                content: post.content,\n                createdAt: post.createdAt,\n                type: 'post'\n            };\n\n            // Add to user's feed (implementation depends on feed storage strategy)\n            // This could be a separate feed container or embedded in user document\n\n            updated++;\n            updateNext();\n        }\n\n        updateNext();\n    });\n}\n";
export declare class OptimizedCosmosClient {
    private client;
    private database;
    private containers;
    private queryPatterns;
    constructor(config: CosmosDBConfig);
    initialize(): Promise<void>;
    private registerStoredProcedures;
    getContainer(name: string): Container;
    getQueryPatterns(name: string): QueryPatterns;
    getRUConsumption(): Promise<{
        containers: {
            [name: string]: {
                consumed: number;
                available: number;
                utilization: number;
            };
        };
    }>;
    optimizeIndexes(): Promise<void>;
}
export declare const cosmosConfig: CosmosDBConfig;
export declare const partitionKeys: typeof PartitionKeyGenerator;
