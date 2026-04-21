/**
 * COSMOS DB DATA ACCESS LAYER
 * Optimized repositories for sub-200ms latency at enterprise scale
 */
import { Container, SqlQuerySpec, FeedOptions } from '@azure/cosmos';
import { OptimizedCosmosClient } from './cosmos-schema';
export declare abstract class CosmosRepository<T extends {
    id: string;
}> {
    private cosmosClient;
    private containerName;
    protected container: Container;
    protected queryPatterns: any;
    constructor(cosmosClient: OptimizedCosmosClient, containerName: string);
    /**
     * Point read by ID - Sub-50ms latency target
     */
    findById(id: string, partitionKey?: string): Promise<T | null>;
    /**
     * Create document with optimized partitioning
     */
    create(document: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    /**
     * Update document with optimistic concurrency
     */
    update(id: string, updates: Partial<T>, partitionKey?: string): Promise<T>;
    /**
     * Delete document
     */
    delete(id: string, partitionKey?: string): Promise<void>;
    /**
     * Execute optimized query with latency monitoring
     */
    protected executeQuery(querySpec: SqlQuerySpec, options?: FeedOptions): Promise<any>;
    /**
     * Generate partition key for document
     */
    protected abstract generatePartitionKey(document: Partial<T>): string;
}
export interface UserDocument {
    id: string;
    partitionKey: string;
    userId: string;
    email: string;
    userType: 'athlete' | 'parent' | 'coach' | 'admin';
    name: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    profile?: {
        avatar?: string;
        bio?: string;
        location?: {
            city: string;
            state: string;
            country: string;
        };
    };
    preferences?: {
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
        privacy: {
            profileVisibility: 'public' | 'private' | 'restricted';
            contactVisibility: 'public' | 'connections' | 'private';
        };
    };
    complianceData?: {
        parentalConsent?: boolean;
        ageVerification?: boolean;
        coppaCompliant?: boolean;
        ferpaCompliant?: boolean;
    };
    lastLoginAt?: string;
    loginCount: number;
    createdAt: string;
    updatedAt: string;
}
export declare class UserRepository extends CosmosRepository<UserDocument> {
    constructor(cosmosClient: OptimizedCosmosClient);
    protected generatePartitionKey(document: Partial<UserDocument>): string;
    /**
     * Get user by ID - Optimized point read
     */
    getUserById(userId: string): Promise<UserDocument | null>;
    /**
     * Get user by email - Uses composite index
     */
    getUserByEmail(email: string, userType: string): Promise<UserDocument | null>;
    /**
     * Get verified users by type - For admin queries
     */
    getVerifiedUsersByType(userType: string, continuationToken?: string, pageSize?: number): Promise<{
        users: UserDocument[];
        continuationToken?: string;
    }>;
    /**
     * Bulk user creation using stored procedure
     */
    bulkCreateUsers(users: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt' | 'partitionKey'>[]): Promise<any>;
    /**
     * Update user login statistics
     */
    updateLoginStats(userId: string): Promise<void>;
}
export interface PostDocument {
    id: string;
    partitionKey: string;
    postId: string;
    authorId: string;
    content: string;
    postType: 'text' | 'image' | 'video' | 'link';
    visibility: 'public' | 'connections' | 'private';
    hashtags: string[];
    mentions: string[];
    location?: {
        name: string;
        coordinates?: [number, number];
    };
    media?: Array<{
        id: string;
        type: 'image' | 'video';
        url: string;
        thumbnail?: string;
        size: number;
    }>;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
    };
    complianceFlags: string[];
    moderationStatus: 'pending' | 'approved' | 'flagged' | 'removed';
    createdAt: string;
    updatedAt: string;
}
export declare class PostRepository extends CosmosRepository<PostDocument> {
    constructor(cosmosClient: OptimizedCosmosClient);
    protected generatePartitionKey(document: Partial<PostDocument>): string;
    /**
     * Get user's posts feed - Optimized for timeline
     */
    getUserPosts(authorId: string, beforeDate?: Date, pageSize?: number): Promise<PostDocument[]>;
    /**
     * Get posts by hashtag - Cross-partition query
     */
    getPostsByHashtag(hashtag: string, beforeDate?: Date, pageSize?: number): Promise<PostDocument[]>;
    /**
     * Update engagement metrics
     */
    updateEngagement(postId: string, updates: Partial<PostDocument['engagement']>): Promise<void>;
    /**
     * Bulk moderation update
     */
    bulkModeratePosts(postIds: string[], status: PostDocument['moderationStatus']): Promise<void>;
}
export interface MessageDocument {
    id: string;
    partitionKey: string;
    messageId: string;
    conversationId: string;
    senderId: string;
    recipientId: string;
    messageType: 'direct' | 'recruitment' | 'scholarship' | 'system';
    content: string;
    status: 'sent' | 'delivered' | 'read';
    attachments?: Array<{
        id: string;
        type: string;
        url: string;
        size: number;
    }>;
    complianceFlags: string[];
    readAt?: string;
    createdAt: string;
    updatedAt: string;
}
export declare class MessageRepository extends CosmosRepository<MessageDocument> {
    constructor(cosmosClient: OptimizedCosmosClient);
    protected generatePartitionKey(document: Partial<MessageDocument>): string;
    /**
     * Get conversation messages - Single partition query
     */
    getConversationMessages(conversationId: string, beforeDate?: Date, pageSize?: number): Promise<MessageDocument[]>;
    /**
     * Get user's inbox - Cross-partition query with optimization
     */
    getUserInbox(userId: string, beforeDate?: Date, pageSize?: number): Promise<MessageDocument[]>;
    /**
     * Mark messages as read - Batch operation
     */
    markMessagesAsRead(messageIds: string[], userId: string): Promise<void>;
    /**
     * Get unread count - Optimized aggregation
     */
    getUnreadCount(userId: string): Promise<number>;
}
export interface SearchDocument {
    id: string;
    partitionKey: string;
    entityType: 'athlete' | 'coach' | 'school';
    entityId: string;
    searchTerms: string[];
    filters: {
        sport?: string;
        state?: string;
        graduationYear?: number;
        gpa?: number;
        ranking?: number;
        school?: string;
        position?: string;
    };
    ranking: {
        overallScore: number;
        athleticScore: number;
        academicScore: number;
        recruitmentScore: number;
    };
    lastUpdated: string;
}
export declare class SearchRepository extends CosmosRepository<SearchDocument> {
    constructor(cosmosClient: OptimizedCosmosClient);
    protected generatePartitionKey(document: Partial<SearchDocument>): string;
    /**
     * Search athletes with filters - Optimized for recruiting
     */
    searchAthletes(filters: {
        sport?: string;
        state?: string;
        graduationYear?: number;
        minGPA?: number;
        maxRanking?: number;
        school?: string;
        position?: string;
    }, sortBy?: 'ranking' | 'academic' | 'recruitment', pageSize?: number): Promise<SearchDocument[]>;
    /**
     * Update search index for entity
     */
    updateSearchIndex(entityId: string, updates: Partial<SearchDocument>): Promise<void>;
}
export interface AuditDocument {
    id: string;
    partitionKey: string;
    action: string;
    resource: string;
    userId?: string;
    userType?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    metadata: Record<string, any>;
    complianceFlags: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
}
export declare class AuditRepository extends CosmosRepository<AuditDocument> {
    constructor(cosmosClient: OptimizedCosmosClient);
    protected generatePartitionKey(document: Partial<AuditDocument>): string;
    /**
     * Log audit event - Optimized for compliance
     */
    logEvent(event: Omit<AuditDocument, 'id' | 'partitionKey'>): Promise<void>;
    /**
     * Get compliance audit trail - Date-partitioned
     */
    getComplianceTrail(userId?: string, complianceType?: string, fromDate?: Date, toDate?: Date, pageSize?: number): Promise<AuditDocument[]>;
    /**
     * Get security incidents - Optimized for monitoring
     */
    getSecurityIncidents(severity?: AuditDocument['severity'], fromDate?: Date): Promise<AuditDocument[]>;
}
export declare class RepositoryFactory {
    private cosmosClient;
    private static instance;
    private repositories;
    private constructor();
    static getInstance(cosmosClient: OptimizedCosmosClient): RepositoryFactory;
    private initializeRepositories;
    getUserRepository(): UserRepository;
    getPostRepository(): PostRepository;
    getMessageRepository(): MessageRepository;
    getSearchRepository(): SearchRepository;
    getAuditRepository(): AuditRepository;
}
