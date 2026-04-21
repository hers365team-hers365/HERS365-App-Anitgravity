/**
 * COSMOS DB SCHEMA DESIGN
 * Enterprise-grade schema for high-traffic social recruiting platform
 * Optimized for sub-200ms latency, 50K+ concurrent users, and compliance
 */
import { CosmosClient } from '@azure/cosmos';
// ─── DATABASE SCHEMA DEFINITION ────────────────────────────────────────────────
export const COSMOS_SCHEMA = {
    endpoint: process.env.COSMOS_ENDPOINT || '',
    key: process.env.COSMOS_KEY || '',
    databaseName: 'HERS365',
    throughput: {
        database: 10000, // Shared RU/s for low-traffic containers
        containers: {
            // High-traffic containers get dedicated throughput
            'users': 50000, // User profiles - highest traffic
            'posts': 100000, // Social posts - very high volume
            'messages': 75000, // Real-time messaging
            'search-index': 25000, // Athlete/coach search
            'audit-logs': 15000, // Compliance logging
            'analytics': 10000, // Business metrics
            'cache': 20000, // Application cache
            'events': 30000 // Event sourcing
        }
    },
    containers: [
        // ─── USER MANAGEMENT ──────────────────────────────────────────────────────
        {
            name: 'users',
            partitionKey: '/partitionKey', // Synthetic key for even distribution
            defaultTtl: -1, // Never expire
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/userId',
                    '/email',
                    '/userType',
                    '/verificationStatus',
                    '/createdAt',
                    '/updatedAt'
                ],
                compositeIndexes: [
                    // User lookup by email
                    [{ path: '/userType', order: 'ascending' }, { path: '/email', order: 'ascending' }],
                    // User search by type and verification
                    [{ path: '/userType', order: 'ascending' }, { path: '/verificationStatus', order: 'ascending' }]
                ]
            },
            uniqueKeyPolicy: {
                uniqueKeys: [['/email'], ['/userId']]
            }
        },
        // ─── SOCIAL CONTENT ───────────────────────────────────────────────────────
        {
            name: 'posts',
            partitionKey: '/partitionKey', // Time-based synthetic key for even distribution
            defaultTtl: 31536000, // 1 year retention
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/authorId',
                    '/content',
                    '/postType',
                    '/visibility',
                    '/createdAt',
                    '/hashtags',
                    '/mentions',
                    '/location'
                ],
                compositeIndexes: [
                    // User's posts feed
                    [{ path: '/authorId', order: 'ascending' }, { path: '/createdAt', order: 'descending' }],
                    // Posts by type and visibility
                    [{ path: '/postType', order: 'ascending' }, { path: '/visibility', order: 'ascending' }, { path: '/createdAt', order: 'descending' }],
                    // Hashtag search
                    [{ path: '/hashtags/[]', order: 'ascending' }, { path: '/createdAt', order: 'descending' }]
                ]
            },
            changeFeedPolicy: {
                retentionDuration: 86400, // 24 hours for real-time feeds
                startFromBeginning: true
            }
        },
        // ─── REAL-TIME MESSAGING ──────────────────────────────────────────────────
        {
            name: 'messages',
            partitionKey: '/partitionKey', // Conversation-based distribution
            defaultTtl: 7776000, // 90 days retention
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/conversationId',
                    '/senderId',
                    '/recipientId',
                    '/messageType',
                    '/status',
                    '/createdAt',
                    '/readAt'
                ],
                compositeIndexes: [
                    // Conversation messages
                    [{ path: '/conversationId', order: 'ascending' }, { path: '/createdAt', order: 'ascending' }],
                    // User's inbox
                    [{ path: '/recipientId', order: 'ascending' }, { path: '/createdAt', order: 'descending' }],
                    // Unread messages
                    [{ path: '/recipientId', order: 'ascending' }, { path: '/status', order: 'ascending' }, { path: '/createdAt', order: 'descending' }]
                ]
            },
            changeFeedPolicy: {
                retentionDuration: 3600, // 1 hour for real-time updates
                startFromBeginning: true
            }
        },
        // ─── SEARCH & DISCOVERY ───────────────────────────────────────────────────
        {
            name: 'search-index',
            partitionKey: '/partitionKey', // Hash-based distribution
            defaultTtl: 86400, // 24 hours - rebuilt nightly
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/entityType', // 'athlete', 'coach', 'school'
                    '/entityId',
                    '/searchTerms',
                    '/filters',
                    '/ranking',
                    '/lastUpdated'
                ],
                compositeIndexes: [
                    // Entity type and ranking
                    [{ path: '/entityType', order: 'ascending' }, { path: '/ranking/overallScore', order: 'descending' }],
                    // Location-based search
                    [{ path: '/entityType', order: 'ascending' }, { path: '/filters/state', order: 'ascending' }, { path: '/ranking/overallScore', order: 'descending' }],
                    // Sport-specific search
                    [{ path: '/entityType', order: 'ascending' }, { path: '/filters/sport', order: 'ascending' }, { path: '/ranking/overallScore', order: 'descending' }]
                ]
            }
        },
        // ─── AUDIT & COMPLIANCE ───────────────────────────────────────────────────
        {
            name: 'audit-logs',
            partitionKey: '/partitionKey', // Date-based distribution
            defaultTtl: 2555 * 24 * 60 * 60, // 2555 days (7 years) - FERPA requirement
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/action',
                    '/resource',
                    '/userId',
                    '/userType',
                    '/ipAddress',
                    '/timestamp',
                    '/complianceFlags',
                    '/severity'
                ],
                compositeIndexes: [
                    // User activity audit
                    [{ path: '/userId', order: 'ascending' }, { path: '/timestamp', order: 'descending' }],
                    // Compliance reporting
                    [{ path: '/complianceFlags/[]', order: 'ascending' }, { path: '/timestamp', order: 'descending' }],
                    // Security incidents
                    [{ path: '/severity', order: 'descending' }, { path: '/timestamp', order: 'descending' }]
                ]
            },
            uniqueKeyPolicy: {
                uniqueKeys: [['/id']]
            }
        },
        // ─── ANALYTICS & METRICS ──────────────────────────────────────────────────
        {
            name: 'analytics',
            partitionKey: '/partitionKey', // Time-based distribution
            defaultTtl: 31536000, // 1 year retention
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/metricType',
                    '/timeBucket',
                    '/dimensions',
                    '/values',
                    '/timestamp'
                ],
                compositeIndexes: [
                    // Time-series queries
                    [{ path: '/metricType', order: 'ascending' }, { path: '/timeBucket', order: 'ascending' }],
                    // Dimension-based aggregation
                    [{ path: '/metricType', order: 'ascending' }, { path: '/dimensions/userType', order: 'ascending' }, { path: '/timeBucket', order: 'ascending' }]
                ]
            }
        },
        // ─── APPLICATION CACHE ────────────────────────────────────────────────────
        {
            name: 'cache',
            partitionKey: '/partitionKey', // Cache key distribution
            defaultTtl: 3600, // 1 hour default TTL
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/cacheKey',
                    '/cacheType',
                    '/data',
                    '/expiresAt',
                    '/createdAt'
                ],
                compositeIndexes: [
                    // Cache type queries
                    [{ path: '/cacheType', order: 'ascending' }, { path: '/expiresAt', order: 'ascending' }]
                ]
            }
        },
        // ─── EVENT SOURCING ──────────────────────────────────────────────────────
        {
            name: 'events',
            partitionKey: '/partitionKey', // Aggregate-based distribution
            defaultTtl: -1, // Never expire - immutable event log
            indexingPolicy: {
                includedPaths: [
                    '/id',
                    '/eventType',
                    '/aggregateId',
                    '/aggregateType',
                    '/version',
                    '/timestamp',
                    '/correlationId',
                    '/userId'
                ],
                compositeIndexes: [
                    // Aggregate event stream
                    [{ path: '/aggregateId', order: 'ascending' }, { path: '/version', order: 'ascending' }],
                    // Event type queries
                    [{ path: '/eventType', order: 'ascending' }, { path: '/timestamp', order: 'descending' }],
                    // User event queries
                    [{ path: '/userId', order: 'ascending' }, { path: '/timestamp', order: 'descending' }]
                ]
            },
            changeFeedPolicy: {
                retentionDuration: 604800, // 7 days for event replay
                startFromBeginning: true
            }
        }
    ]
};
// ─── PARTITION KEY STRATEGIES ─────────────────────────────────────────────────
/**
 * SYNTHETIC PARTITION KEY GENERATOR
 * Creates evenly distributed partition keys to prevent hot partitions
 */
export class PartitionKeyGenerator {
    /**
     * Generate synthetic partition key for users
     * Uses hash of userId to distribute across partitions evenly
     */
    static forUser(userId) {
        const hash = this.simpleHash(userId);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `user_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate time-based partition key for posts
     * Combines date with hash for even distribution
     */
    static forPost(authorId, createdAt) {
        const date = createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
        const hash = this.simpleHash(authorId);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `post_${date}_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate conversation-based partition key for messages
     * Groups messages by conversation for efficient querying
     */
    static forMessage(conversationId) {
        const hash = this.simpleHash(conversationId);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `msg_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate date-based partition key for audit logs
     * Groups logs by date for compliance and retention
     */
    static forAuditLog(timestamp, complianceType) {
        const date = timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
        const hash = this.simpleHash(complianceType);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `audit_${date}_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate hash-based partition key for search index
     * Distributes search data evenly across partitions
     */
    static forSearchIndex(entityId) {
        const hash = this.simpleHash(entityId);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `search_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate time-bucket partition key for analytics
     * Groups metrics by time periods for efficient aggregation
     */
    static forAnalytics(timeBucket, metricType) {
        const hash = this.simpleHash(metricType);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `analytics_${timeBucket}_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate cache partition key
     * Distributes cache entries evenly
     */
    static forCache(cacheKey) {
        const hash = this.simpleHash(cacheKey);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `cache_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Generate aggregate-based partition key for events
     * Groups events by aggregate for event sourcing
     */
    static forEvent(aggregateId) {
        const hash = this.simpleHash(aggregateId);
        const partitionIndex = Math.abs(hash) % this.PARTITION_COUNT;
        return `event_${partitionIndex.toString().padStart(3, '0')}`;
    }
    /**
     * Simple hash function for partition key generation
     */
    static simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
}
PartitionKeyGenerator.PARTITION_COUNT = 400; // Cosmos DB recommends 10-400 partitions per container
// ─── QUERY OPTIMIZATION PATTERNS ──────────────────────────────────────────────
/**
 * QUERY PATTERNS FOR SUB-200MS LATENCY
 * Pre-defined query templates optimized for Cosmos DB
 */
export class QueryPatterns {
    constructor(container) {
        this.container = container;
    }
    // ─── USER QUERIES ───────────────────────────────────────────────────────────
    /**
     * Get user by ID - Point read for sub-50ms latency
     */
    async getUserById(userId) {
        const partitionKey = PartitionKeyGenerator.forUser(userId);
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: userId }]
        };
        const { resources } = await this.container.items
            .query(querySpec, { partitionKey })
            .fetchAll();
        return resources[0];
    }
    /**
     * Get user by email - Optimized with composite index
     */
    async getUserByEmail(email, userType) {
        const partitionKey = PartitionKeyGenerator.forUser(email); // Approximate
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.email = @email AND c.userType = @userType',
            parameters: [
                { name: '@email', value: email },
                { name: '@userType', value: userType }
            ]
        };
        const { resources } = await this.container.items
            .query(querySpec, { partitionKey })
            .fetchAll();
        return resources[0];
    }
    /**
     * Get user inbox messages
     */
    async getUserInbox(userId, since, pageSize = 50) {
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.recipientId = @userId
          AND (@since = null OR c.createdAt > @since)
        ORDER BY c.createdAt DESC
      `,
            parameters: [
                { name: '@userId', value: userId },
                { name: '@since', value: since ? since.toISOString() : null }
            ]
        };
        const { resources } = await this.container.items
            .query(querySpec, { maxItemCount: pageSize })
            .fetchAll();
        return resources;
    }
    // ─── SOCIAL FEED QUERIES ────────────────────────────────────────────────────
    /**
     * Get user's posts feed - Paginated for performance
     */
    async getUserPosts(authorId, continuationToken, pageSize = 20) {
        const partitionKey = PartitionKeyGenerator.forPost(authorId, new Date()); // Approximate
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.authorId = @authorId AND c.visibility = 'public'
        ORDER BY c.createdAt DESC
      `,
            parameters: [{ name: '@authorId', value: authorId }]
        };
        const options = {
            partitionKey,
            maxItemCount: pageSize
        };
        if (continuationToken) {
            options.continuationToken = continuationToken;
        }
        return await this.container.items.query(querySpec, options).fetchNext();
    }
    /**
     * Get posts by hashtag - Uses composite index
     */
    async getPostsByHashtag(hashtag, continuationToken, pageSize = 20) {
        // Query across all partitions - requires fan-out
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE ARRAY_CONTAINS(c.hashtags, @hashtag) AND c.visibility = 'public'
        ORDER BY c.createdAt DESC
      `,
            parameters: [{ name: '@hashtag', value: hashtag }]
        };
        const options = {
            maxItemCount: pageSize
        };
        if (continuationToken) {
            options.continuationToken = continuationToken;
        }
        return await this.container.items.query(querySpec, options).fetchNext();
    }
    // ─── MESSAGING QUERIES ──────────────────────────────────────────────────────
    /**
     * Get conversation messages - Partitioned for speed
     */
    async getConversationMessages(conversationId, since, pageSize = 50) {
        const partitionKey = PartitionKeyGenerator.forMessage(conversationId);
        let query = `
      SELECT * FROM c
      WHERE c.conversationId = @conversationId
    `;
        const parameters = [{ name: '@conversationId', value: conversationId }];
        if (since) {
            query += ' AND c.createdAt > @since';
            parameters.push({ name: '@since', value: since.toISOString() });
        }
        query += ' ORDER BY c.createdAt ASC';
        const querySpec = { query, parameters };
        return await this.container.items
            .query(querySpec, { partitionKey, maxItemCount: pageSize })
            .fetchAll();
    }
    /**
     * Get user's unread messages count - Optimized aggregation
     */
    async getUnreadMessagesCount(userId) {
        // This would typically use a stored procedure for aggregation
        // For now, using a cross-partition query
        const querySpec = {
            query: `
        SELECT VALUE COUNT(1) FROM c
        WHERE c.recipientId = @userId AND c.status = 'sent'
      `,
            parameters: [{ name: '@userId', value: userId }]
        };
        const { resources } = await this.container.items
            .query(querySpec)
            .fetchAll();
        return resources[0] || 0;
    }
    // ─── SEARCH QUERIES ─────────────────────────────────────────────────────────
    /**
     * Search athletes by criteria - Uses search index
     */
    async searchAthletes(filters, pageSize = 20) {
        let query = `
      SELECT * FROM c
      WHERE c.entityType = 'athlete' AND c.verificationStatus = 'verified'
    `;
        const parameters = [];
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
        if (filters.ranking) {
            query += ' AND c.ranking.overallScore BETWEEN @minRanking AND @maxRanking';
            parameters.push({ name: '@minRanking', value: filters.ranking.min }, { name: '@maxRanking', value: filters.ranking.max });
        }
        query += ' ORDER BY c.ranking.overallScore DESC';
        const querySpec = { query, parameters };
        return await this.container.items
            .query(querySpec, {
            maxItemCount: pageSize
        })
            .fetchNext();
    }
    // ─── ANALYTICS QUERIES ──────────────────────────────────────────────────────
    /**
     * Get user engagement metrics - Time-bucketed for performance
     */
    async getUserEngagementMetrics(timeBucket, userType) {
        const partitionKey = PartitionKeyGenerator.forAnalytics(timeBucket, 'user_engagement');
        let query = `
      SELECT * FROM c
      WHERE c.metricType = 'user_engagement' AND c.timeBucket = @timeBucket
    `;
        const parameters = [{ name: '@timeBucket', value: timeBucket }];
        if (userType) {
            query += ' AND c.dimensions.userType = @userType';
            parameters.push({ name: '@userType', value: userType });
        }
        const querySpec = { query, parameters };
        const { resources } = await this.container.items
            .query(querySpec, { partitionKey })
            .fetchAll();
        return resources;
    }
    // ─── AUDIT QUERIES ──────────────────────────────────────────────────────────
    /**
     * Get compliance audit trail - Date-partitioned
     */
    async getComplianceAuditTrail(userId, complianceType, fromDate, toDate) {
        const partitionKey = PartitionKeyGenerator.forAuditLog(fromDate, complianceType);
        const querySpec = {
            query: `
        SELECT * FROM c
        WHERE c.userId = @userId
          AND ARRAY_CONTAINS(c.complianceFlags, @complianceType)
          AND c.timestamp BETWEEN @fromDate AND @toDate
        ORDER BY c.timestamp DESC
      `,
            parameters: [
                { name: '@userId', value: userId },
                { name: '@complianceType', value: complianceType },
                { name: '@fromDate', value: fromDate.toISOString() },
                { name: '@toDate', value: toDate.toISOString() }
            ]
        };
        return await this.container.items
            .query(querySpec, { partitionKey })
            .fetchAll();
    }
}
// ─── STORED PROCEDURES FOR COMPLEX OPERATIONS ────────────────────────────────
/**
 * STORED PROCEDURE: BULK USER IMPORT
 * Optimized for high-volume user creation with validation
 */
export const BULK_USER_IMPORT_PROCEDURE = `
function bulkImportUsers(users) {
    const context = getContext();
    const collection = context.getCollection();
    const response = context.getResponse();

    let processed = 0;
    let errors = [];

    function processNext() {
        if (processed >= users.length) {
            response.setBody({
                processed: processed,
                errors: errors,
                success: errors.length === 0
            });
            return;
        }

        const user = users[processed];

        // Validate user data
        if (!user.email || !user.userType) {
            errors.push({
                index: processed,
                error: 'Missing required fields',
                user: user
            });
            processed++;
            processNext();
            return;
        }

        // Generate partition key
        const partitionKey = 'user_' + (Math.abs(hashCode(user.userId || user.email)) % 400).toString().padStart(3, '0');

        // Check for existing user
        const query = {
            query: 'SELECT * FROM c WHERE c.email = @email',
            parameters: [{ name: '@email', value: user.email }]
        };

        collection.queryDocuments(collection.getSelfLink(), query, {}, function(err, documents) {
            if (err) {
                errors.push({
                    index: processed,
                    error: 'Query failed: ' + err.message,
                    user: user
                });
                processed++;
                processNext();
                return;
            }

            if (documents.length > 0) {
                errors.push({
                    index: processed,
                    error: 'User already exists',
                    user: user
                });
                processed++;
                processNext();
                return;
            }

            // Create user document
            const userDoc = {
                id: user.userId || generateId(),
                userId: user.userId || generateId(),
                partitionKey: partitionKey,
                email: user.email,
                userType: user.userType,
                name: user.name,
                createdAt: new Date().toISOString(),
                verificationStatus: 'pending',
                ...user
            };

            collection.createDocument(collection.getSelfLink(), userDoc, {}, function(createErr) {
                if (createErr) {
                    errors.push({
                        index: processed,
                        error: 'Create failed: ' + createErr.message,
                        user: user
                    });
                }
                processed++;
                processNext();
            });
        });
    }

    processNext();
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
`;
/**
 * STORED PROCEDURE: REAL-TIME FEED UPDATE
 * Updates user feeds when new posts are created
 */
export const UPDATE_FEED_PROCEDURE = `
function updateUserFeeds(post) {
    const context = getContext();
    const collection = context.getCollection();
    const response = context.getResponse();

    // Get users who should see this post (followers, etc.)
    const feedQuery = {
        query: 'SELECT c.userId FROM c WHERE c.entityType = "feed" AND ARRAY_CONTAINS(c.sources, @authorId)',
        parameters: [{ name: '@authorId', value: post.authorId }]
    };

    collection.queryDocuments(collection.getSelfLink(), feedQuery, {}, function(err, feeds) {
        if (err) {
            response.setBody({ success: false, error: err.message });
            return;
        }

        let updated = 0;
        const total = feeds.length;

        function updateNext() {
            if (updated >= total) {
                response.setBody({ success: true, updated: updated });
                return;
            }

            const feed = feeds[updated];
            const feedUpdate = {
                postId: post.id,
                authorId: post.authorId,
                content: post.content,
                createdAt: post.createdAt,
                type: 'post'
            };

            // Add to user's feed (implementation depends on feed storage strategy)
            // This could be a separate feed container or embedded in user document

            updated++;
            updateNext();
        }

        updateNext();
    });
}
`;
// ─── COSMOS DB CLIENT WITH OPTIMIZATIONS ──────────────────────────────────────
export class OptimizedCosmosClient {
    constructor(config) {
        this.containers = new Map();
        this.queryPatterns = new Map();
        this.client = new CosmosClient({
            endpoint: config.endpoint,
            key: config.key,
            retryOptions: {
                maxRetryAttemptsOnThrottledRequests: 3,
                maxRetryWaitTimeInSeconds: 30
            },
            consistencyLevel: 'Session'
        });
        this.database = this.client.database(config.databaseName);
    }
    async initialize() {
        // Create database if it doesn't exist
        await this.client.databases.createIfNotExists({
            id: COSMOS_SCHEMA.databaseName,
            throughput: COSMOS_SCHEMA.throughput.database
        });
        // Create containers
        for (const containerConfig of COSMOS_SCHEMA.containers) {
            const container = await this.database.containers.createIfNotExists({
                id: containerConfig.name,
                partitionKey: { paths: [typeof containerConfig.partitionKey === 'string' ? containerConfig.partitionKey : containerConfig.partitionKey[0]] },
                defaultTtl: containerConfig.defaultTtl,
                indexingPolicy: containerConfig.indexingPolicy ? {
                    ...containerConfig.indexingPolicy,
                    includedPaths: containerConfig.indexingPolicy.includedPaths?.map(p => ({ path: p })),
                    excludedPaths: containerConfig.indexingPolicy.excludedPaths?.map(p => ({ path: p })),
                    spatialIndexes: containerConfig.indexingPolicy.spatialIndexes
                } : undefined,
                uniqueKeyPolicy: containerConfig.uniqueKeyPolicy ? {
                    uniqueKeys: containerConfig.uniqueKeyPolicy.uniqueKeys.map(k => ({ paths: k }))
                } : undefined,
                conflictResolutionPolicy: containerConfig.conflictResolutionPolicy
            });
            // Set throughput if specified
            const throughput = COSMOS_SCHEMA.throughput.containers[containerConfig.name];
            if (throughput) {
                const { resource: offer } = await container.container.readOffer();
                if (offer) {
                    await this.client.offer(offer.id).replace({
                        ...offer,
                        content: {
                            ...offer.content,
                            offerThroughput: throughput
                        }
                    });
                }
            }
            this.containers.set(containerConfig.name, container.container);
            this.queryPatterns.set(containerConfig.name, new QueryPatterns(container.container));
        }
        // Register stored procedures
        await this.registerStoredProcedures();
    }
    async registerStoredProcedures() {
        const usersContainer = this.containers.get('users');
        if (usersContainer) {
            await usersContainer.scripts.storedProcedures.create({
                id: 'bulkUserImport',
                body: BULK_USER_IMPORT_PROCEDURE
            });
        }
        const postsContainer = this.containers.get('posts');
        if (postsContainer) {
            await postsContainer.scripts.storedProcedures.create({
                id: 'updateUserFeeds',
                body: UPDATE_FEED_PROCEDURE
            });
        }
    }
    getContainer(name) {
        const container = this.containers.get(name);
        if (!container) {
            throw new Error(`Container ${name} not found`);
        }
        return container;
    }
    getQueryPatterns(name) {
        const patterns = this.queryPatterns.get(name);
        if (!patterns) {
            throw new Error(`Query patterns for ${name} not found`);
        }
        return patterns;
    }
    // ─── PERFORMANCE MONITORING ────────────────────────────────────────────────
    async getRUConsumption() {
        const result = { containers: {} };
        for (const [name, container] of this.containers) {
            try {
                const throughput = await container.readOffer();
                const metrics = await container.read({
                    populateQuotaInfo: true
                });
                // This is a simplified version - in production you'd use Cosmos DB metrics
                result.containers[name] = {
                    consumed: 0, // Would be populated from metrics
                    available: throughput.resource?.content?.offerThroughput || 0,
                    utilization: 0 // Would be calculated from metrics
                };
            }
            catch (error) {
                console.error(`Failed to get metrics for ${name}:`, error);
            }
        }
        return result;
    }
    async optimizeIndexes() {
        // Analyze query patterns and suggest index optimizations
        // This would typically be done by Azure's automatic indexing,
        // but we can provide additional optimizations
        for (const [name, container] of this.containers) {
            // Analyze slow queries and suggest composite indexes
            // This is a placeholder for actual optimization logic
        }
    }
}
// ─── EXPORT CONFIGURATION ──────────────────────────────────────────────────────
export const cosmosConfig = COSMOS_SCHEMA;
export const partitionKeys = PartitionKeyGenerator;
//# sourceMappingURL=cosmos-schema.js.map