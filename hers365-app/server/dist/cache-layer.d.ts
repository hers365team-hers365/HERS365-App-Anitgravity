/**
 * HYBRID CACHING LAYER
 * Redis + Cosmos DB for sub-200ms latency at enterprise scale
 */
import { OptimizedCosmosClient } from './cosmos-schema';
export interface CacheConfig {
    redis: {
        url: string;
        cluster: boolean;
        ttl: {
            user: number;
            post: number;
            search: number;
            analytics: number;
            session: number;
        };
    };
    strategies: {
        cacheAside: boolean;
        writeThrough: boolean;
        writeBehind: boolean;
        refreshAhead: boolean;
    };
    performance: {
        targetLatency: number;
        slowQueryThreshold: number;
        cacheHitRatioTarget: number;
    };
}
declare const defaultConfig: CacheConfig;
export declare class RedisCacheClient {
    private client;
    private config;
    private metrics;
    constructor(config?: Partial<CacheConfig>);
    private initializeClient;
    /**
     * Get cached value with JSON parsing
     */
    get(key: string): Promise<any | null>;
    /**
     * Set cached value with JSON serialization
     */
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    /**
     * Delete cached value
     */
    delete(key: string): Promise<boolean>;
    /**
     * Set multiple keys with TTL
     */
    msetex(keyValuePairs: Array<[string, any, number]>): Promise<boolean>;
    /**
     * Get cache hit ratio
     */
    getHitRatio(): number;
    /**
     * Get cache metrics
     */
    getMetrics(): any;
    /**
     * Close connection
     */
    close(): Promise<void>;
}
export declare class HybridCacheManager {
    private redis;
    private cosmos;
    private repositories;
    private config;
    constructor(redisClient: RedisCacheClient, cosmosClient: OptimizedCosmosClient, config?: Partial<CacheConfig>);
    /**
     * Get user with cache-aside strategy - Sub-50ms target
     */
    getUser(userId: string): Promise<any | null>;
    /**
     * Update user with write-through strategy
     */
    updateUser(userId: string, updates: any): Promise<any>;
    /**
     * Invalidate user-related caches
     */
    private invalidateUserRelatedCaches;
    /**
     * Get user's posts with pagination and caching
     */
    getUserPosts(userId: string, page?: number, limit?: number): Promise<{
        posts: any[];
        total: number;
        cached: boolean;
    }>;
    /**
     * Create post with write-through caching
     */
    createPost(postData: any): Promise<any>;
    /**
     * Search athletes with intelligent caching
     */
    searchAthletes(filters: any, sortBy?: string): Promise<{
        results: any[];
        cached: boolean;
        cacheKey: string;
    }>;
    /**
     * Get conversation messages with caching
     */
    getConversationMessages(conversationId: string, beforeDate?: Date, limit?: number): Promise<{
        messages: any[];
        cached: boolean;
    }>;
    /**
     * Get analytics data with time-bucketed caching
     */
    getAnalytics(metricType: string, timeBucket: string, dimensions?: any): Promise<{
        data: any[];
        cached: boolean;
    }>;
    private latencyMetrics;
    /**
     * Record operation latency for performance monitoring
     */
    private recordLatency;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): any;
    /**
     * Warm up cache with frequently accessed data
     */
    warmupCache(): Promise<void>;
    /**
     * Update search index cache
     */
    private updateSearchIndexCache;
    /**
     * Get cache statistics
     */
    getCacheStats(): any;
}
export declare class CacheAsideManager {
    private cache;
    constructor(cache: HybridCacheManager);
    /**
     * Get data with cache-aside pattern
     */
    get<T>(key: string, fetcher: () => Promise<T | null>, ttl?: number): Promise<T | null>;
    /**
     * Set data with cache-aside pattern (write-through)
     */
    set<T>(key: string, data: T, persister: (data: T) => Promise<void>, ttl?: number): Promise<void>;
    /**
     * Invalidate cache key
     */
    invalidate(key: string): Promise<void>;
    /**
     * Invalidate multiple keys with pattern
     */
    invalidatePattern(pattern: string): Promise<void>;
}
export { defaultConfig as cacheConfig };
