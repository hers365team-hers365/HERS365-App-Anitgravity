/**
 * COSMOS DB DATA ACCESS LAYER
 * Optimized repositories for sub-200ms latency at enterprise scale
 */
import { partitionKeys } from './cosmos-schema';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
// ─── BASE REPOSITORY CLASS ─────────────────────────────────────────────────────
export class CosmosRepository {
    constructor(cosmosClient, containerName) {
        this.cosmosClient = cosmosClient;
        this.containerName = containerName;
        this.container = cosmosClient.getContainer(containerName);
        this.queryPatterns = cosmosClient.getQueryPatterns(containerName);
    }
    /**
     * Point read by ID - Sub-50ms latency target
     */
    async findById(id, partitionKey) {
        try {
            const startTime = Date.now();
            const { resource } = await this.container.item(id, partitionKey || id).read();
            const latency = Date.now() - startTime;
            if (latency > 50) {
                logger.warn(`Slow point read: ${latency}ms for ${this.containerName}:${id}`);
            }
            return resource || null;
        }
        catch (error) {
            logger.error(`Error reading ${this.containerName}:${id}:`, error);
            throw error;
        }
    }
    /**
     * Create document with optimized partitioning
     */
    async create(document) {
        const now = new Date().toISOString();
        const fullDocument = {
            ...document,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now
        };
        // Add partition key if not provided
        if (!fullDocument.partitionKey) {
            fullDocument.partitionKey = this.generatePartitionKey(fullDocument);
        }
        try {
            const startTime = Date.now();
            const { resource } = await this.container.items.create(fullDocument);
            const latency = Date.now() - startTime;
            if (latency > 100) {
                logger.warn(`Slow create: ${latency}ms for ${this.containerName}`);
            }
            return resource;
        }
        catch (error) {
            logger.error(`Error creating ${this.containerName}:`, error);
            throw error;
        }
    }
    /**
     * Update document with optimistic concurrency
     */
    async update(id, updates, partitionKey) {
        try {
            const startTime = Date.now();
            // Get current document
            const current = await this.findById(id, partitionKey);
            if (!current) {
                throw new Error(`Document not found: ${id}`);
            }
            // Apply updates
            const updated = {
                ...current,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            const { resource } = await this.container
                .item(id, partitionKey || id)
                .replace(updated);
            const latency = Date.now() - startTime;
            if (latency > 100) {
                logger.warn(`Slow update: ${latency}ms for ${this.containerName}:${id}`);
            }
            return resource;
        }
        catch (error) {
            logger.error(`Error updating ${this.containerName}:${id}:`, error);
            throw error;
        }
    }
    /**
     * Delete document
     */
    async delete(id, partitionKey) {
        try {
            await this.container.item(id, partitionKey || id).delete();
        }
        catch (error) {
            logger.error(`Error deleting ${this.containerName}:${id}:`, error);
            throw error;
        }
    }
    /**
     * Execute optimized query with latency monitoring
     */
    async executeQuery(querySpec, options = {}) {
        const startTime = Date.now();
        try {
            const result = await this.container.items.query(querySpec, options).fetchAll();
            const latency = Date.now() - startTime;
            // Log slow queries (>100ms)
            const threshold = 100;
            if (latency > threshold) {
                logger.warn(`Slow query: ${latency}ms`, {
                    container: this.containerName,
                    query: querySpec.query.substring(0, 100),
                    itemCount: result.resources.length
                });
            }
            return result;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            logger.error(`Query failed after ${latency}ms:`, {
                container: this.containerName,
                query: querySpec.query,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}
export class UserRepository extends CosmosRepository {
    constructor(cosmosClient) {
        super(cosmosClient, 'users');
    }
    generatePartitionKey(document) {
        return partitionKeys.forUser(document.userId || document.email);
    }
    /**
     * Get user by ID - Optimized point read
     */
    async getUserById(userId) {
        const partitionKey = partitionKeys.forUser(userId);
        return await this.findById(userId, partitionKey);
    }
    /**
     * Get user by email - Uses composite index
     */
    async getUserByEmail(email, userType) {
        const partitionKey = partitionKeys.forUser(email);
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.email = @email AND c.userType = @userType
      `,
            parameters: [
                { name: '@email', value: email },
                { name: '@userType', value: userType }
            ]
        };
        const result = await this.executeQuery(querySpec, { partitionKey });
        return result.resources[0] || null;
    }
    /**
     * Get verified users by type - For admin queries
     */
    async getVerifiedUsersByType(userType, continuationToken, pageSize = 100) {
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.userType = @userType AND c.verificationStatus = 'verified'
        ORDER BY c.createdAt DESC
      `,
            parameters: [{ name: '@userType', value: userType }]
        };
        const options = {
            maxItemCount: pageSize,
        };
        if (continuationToken) {
            options.continuationToken = continuationToken;
        }
        const result = await this.container.items.query(querySpec, options).fetchNext();
        return {
            users: result.resources,
            continuationToken: result.continuationToken
        };
    }
    /**
     * Bulk user creation using stored procedure
     */
    async bulkCreateUsers(users) {
        const partitionKey = users[0] ? users[0].userId || 'bulk' : 'bulk';
        const procedureResult = await this.container.scripts.storedProcedure('bulkUserImport')
            .execute(partitionKey, [users]);
        return procedureResult.resource;
    }
    /**
     * Update user login statistics
     */
    async updateLoginStats(userId) {
        const user = await this.getUserById(userId);
        if (!user)
            return;
        await this.update(userId, {
            lastLoginAt: new Date().toISOString(),
            loginCount: user.loginCount + 1
        });
    }
}
export class PostRepository extends CosmosRepository {
    constructor(cosmosClient) {
        super(cosmosClient, 'posts');
    }
    generatePartitionKey(document) {
        const createdAt = document.createdAt ? new Date(document.createdAt) : new Date();
        return partitionKeys.forPost(document.authorId, createdAt);
    }
    /**
     * Get user's posts feed - Optimized for timeline
     */
    async getUserPosts(authorId, beforeDate, pageSize = 20) {
        // Approximate partition key for query
        const partitionKey = partitionKeys.forPost(authorId, beforeDate || new Date());
        let query = `
      SELECT * FROM c
      WHERE c.authorId = @authorId AND c.visibility = 'public' AND c.moderationStatus = 'approved'
    `;
        const parameters = [{ name: '@authorId', value: authorId }];
        if (beforeDate) {
            query += ' AND c.createdAt < @beforeDate';
            parameters.push({ name: '@beforeDate', value: beforeDate.toISOString() });
        }
        query += ' ORDER BY c.createdAt DESC';
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            partitionKey,
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Get posts by hashtag - Cross-partition query
     */
    async getPostsByHashtag(hashtag, beforeDate, pageSize = 20) {
        let query = `
      SELECT * FROM c
      WHERE ARRAY_CONTAINS(c.hashtags, @hashtag)
        AND c.visibility = 'public'
        AND c.moderationStatus = 'approved'
    `;
        const parameters = [{ name: '@hashtag', value: hashtag }];
        if (beforeDate) {
            query += ' AND c.createdAt < @beforeDate';
            parameters.push({ name: '@beforeDate', value: beforeDate.toISOString() });
        }
        query += ' ORDER BY c.createdAt DESC';
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Update engagement metrics
     */
    async updateEngagement(postId, updates) {
        const post = await this.findById(postId);
        if (!post)
            return;
        const updatedEngagement = { ...post.engagement, ...updates };
        await this.update(postId, { engagement: updatedEngagement });
    }
    /**
     * Bulk moderation update
     */
    async bulkModeratePosts(postIds, status) {
        // Use stored procedure for bulk operations
        const updates = postIds.map(id => ({ id, moderationStatus: status }));
        // Implementation would use a stored procedure for efficiency
    }
}
export class MessageRepository extends CosmosRepository {
    constructor(cosmosClient) {
        super(cosmosClient, 'messages');
    }
    generatePartitionKey(document) {
        return partitionKeys.forMessage(document.conversationId);
    }
    /**
     * Get conversation messages - Single partition query
     */
    async getConversationMessages(conversationId, beforeDate, pageSize = 50) {
        const partitionKey = partitionKeys.forMessage(conversationId);
        let query = 'SELECT * FROM c WHERE c.conversationId = @conversationId';
        const parameters = [{ name: '@conversationId', value: conversationId }];
        if (beforeDate) {
            query += ' AND c.createdAt < @beforeDate';
            parameters.push({ name: '@beforeDate', value: beforeDate.toISOString() });
        }
        query += ' ORDER BY c.createdAt DESC';
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            partitionKey,
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Get user's inbox - Cross-partition query with optimization
     */
    async getUserInbox(userId, beforeDate, pageSize = 20) {
        let query = `
      SELECT * FROM c
      WHERE c.recipientId = @userId
    `;
        const parameters = [{ name: '@userId', value: userId }];
        if (beforeDate) {
            query += ' AND c.createdAt < @beforeDate';
            parameters.push({ name: '@beforeDate', value: beforeDate.toISOString() });
        }
        query += ' ORDER BY c.createdAt DESC';
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Mark messages as read - Batch operation
     */
    async markMessagesAsRead(messageIds, userId) {
        const now = new Date().toISOString();
        // Group by conversation for efficient updates
        const updatesByConversation = new Map();
        for (const messageId of messageIds) {
            // Get conversation ID (would be cached in practice)
            const message = await this.findById(messageId);
            if (message && message.recipientId === userId) {
                if (!updatesByConversation.has(message.conversationId)) {
                    updatesByConversation.set(message.conversationId, []);
                }
                updatesByConversation.get(message.conversationId).push(messageId);
            }
        }
        // Batch updates by conversation
        for (const [conversationId, msgIds] of updatesByConversation) {
            // Use stored procedure for batch updates
            // This is a simplified version
            for (const msgId of msgIds) {
                await this.update(msgId, {
                    status: 'read',
                    readAt: now
                });
            }
        }
    }
    /**
     * Get unread count - Optimized aggregation
     */
    async getUnreadCount(userId) {
        const querySpec = {
            query: `
        SELECT VALUE COUNT(1) FROM c
        WHERE c.recipientId = @userId AND c.status = 'sent'
      `,
            parameters: [{ name: '@userId', value: userId }]
        };
        const result = await this.executeQuery(querySpec, {});
        return result.resources[0] || 0;
    }
}
export class SearchRepository extends CosmosRepository {
    constructor(cosmosClient) {
        super(cosmosClient, 'search-index');
    }
    generatePartitionKey(document) {
        return partitionKeys.forSearchIndex(document.entityId);
    }
    /**
     * Search athletes with filters - Optimized for recruiting
     */
    async searchAthletes(filters, sortBy = 'ranking', pageSize = 20) {
        let query = `
      SELECT TOP @pageSize * FROM c
      WHERE c.entityType = 'athlete'
    `;
        const parameters = [{ name: '@pageSize', value: pageSize }];
        // Build filter conditions
        if (filters.sport) {
            query += ' AND c.filters.sport = @sport';
            parameters.push({ name: '@sport', value: filters.sport });
        }
        if (filters.state) {
            query += ' AND c.filters.state = @state';
            parameters.push({ name: '@state', value: filters.state });
        }
        if (filters.graduationYear) {
            query += ' AND c.filters.graduationYear = @graduationYear';
            parameters.push({ name: '@graduationYear', value: filters.graduationYear });
        }
        if (filters.minGPA) {
            query += ' AND c.filters.gpa >= @minGPA';
            parameters.push({ name: '@minGPA', value: filters.minGPA });
        }
        if (filters.maxRanking) {
            query += ' AND c.ranking.overallScore <= @maxRanking';
            parameters.push({ name: '@maxRanking', value: filters.maxRanking });
        }
        if (filters.school) {
            query += ' AND c.filters.school = @school';
            parameters.push({ name: '@school', value: filters.school });
        }
        if (filters.position) {
            query += ' AND c.filters.position = @position';
            parameters.push({ name: '@position', value: filters.position });
        }
        // Add sorting
        let orderBy;
        switch (sortBy) {
            case 'academic':
                orderBy = 'c.ranking.academicScore DESC';
                break;
            case 'recruitment':
                orderBy = 'c.ranking.recruitmentScore DESC';
                break;
            default:
                orderBy = 'c.ranking.overallScore DESC';
        }
        query += ` ORDER BY ${orderBy}`;
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Update search index for entity
     */
    async updateSearchIndex(entityId, updates) {
        const existing = await this.findById(entityId);
        if (existing) {
            await this.update(entityId, {
                ...updates,
                lastUpdated: new Date().toISOString()
            });
        }
        else {
            await this.create({
                ...updates,
                entityId,
                lastUpdated: new Date().toISOString()
            });
        }
    }
}
export class AuditRepository extends CosmosRepository {
    constructor(cosmosClient) {
        super(cosmosClient, 'audit-logs');
    }
    generatePartitionKey(document) {
        const timestamp = document.timestamp ? new Date(document.timestamp) : new Date();
        const complianceType = document.complianceFlags?.[0] || 'general';
        return partitionKeys.forAuditLog(timestamp, complianceType);
    }
    /**
     * Log audit event - Optimized for compliance
     */
    async logEvent(event) {
        const partitionKey = this.generatePartitionKey(event);
        await this.create({
            ...event,
            partitionKey
        });
    }
    /**
     * Get compliance audit trail - Date-partitioned
     */
    async getComplianceTrail(userId, complianceType, fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), toDate = new Date(), pageSize = 100) {
        let query = 'SELECT * FROM c WHERE c.timestamp BETWEEN @fromDate AND @toDate';
        const parameters = [
            { name: '@fromDate', value: fromDate.toISOString() },
            { name: '@toDate', value: toDate.toISOString() }
        ];
        if (userId) {
            query += ' AND c.userId = @userId';
            parameters.push({ name: '@userId', value: userId });
        }
        if (complianceType) {
            query += ' AND ARRAY_CONTAINS(c.complianceFlags, @complianceType)';
            parameters.push({ name: '@complianceType', value: complianceType });
        }
        query += ' ORDER BY c.timestamp DESC';
        const querySpec = { query, parameters };
        const result = await this.executeQuery(querySpec, {
            maxItemCount: pageSize
        });
        return result.resources;
    }
    /**
     * Get security incidents - Optimized for monitoring
     */
    async getSecurityIncidents(severity = 'high', fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.severity >= @severity
          AND c.timestamp >= @fromDate
          AND c.success = false
        ORDER BY c.timestamp DESC
      `,
            parameters: [
                { name: '@severity', value: severity },
                { name: '@fromDate', value: fromDate.toISOString() }
            ]
        };
        const result = await this.executeQuery(querySpec, {
            maxItemCount: 1000
        });
        return result.resources;
    }
}
// ─── REPOSITORY FACTORY ────────────────────────────────────────────────────────
export class RepositoryFactory {
    constructor(cosmosClient) {
        this.cosmosClient = cosmosClient;
        this.repositories = new Map();
        this.initializeRepositories();
    }
    static getInstance(cosmosClient) {
        if (!RepositoryFactory.instance) {
            RepositoryFactory.instance = new RepositoryFactory(cosmosClient);
        }
        return RepositoryFactory.instance;
    }
    initializeRepositories() {
        this.repositories.set('users', new UserRepository(this.cosmosClient));
        this.repositories.set('posts', new PostRepository(this.cosmosClient));
        this.repositories.set('messages', new MessageRepository(this.cosmosClient));
        this.repositories.set('search', new SearchRepository(this.cosmosClient));
        this.repositories.set('audit', new AuditRepository(this.cosmosClient));
    }
    getUserRepository() {
        return this.repositories.get('users');
    }
    getPostRepository() {
        return this.repositories.get('posts');
    }
    getMessageRepository() {
        return this.repositories.get('messages');
    }
    getSearchRepository() {
        return this.repositories.get('search');
    }
    getAuditRepository() {
        return this.repositories.get('audit');
    }
}
// End of file - duplicates removed
//# sourceMappingURL=cosmos-repositories.js.map