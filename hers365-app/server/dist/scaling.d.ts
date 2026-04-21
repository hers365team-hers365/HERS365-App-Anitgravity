/**
 * SCALING AND MONITORING UTILITIES
 * Enterprise-grade scaling solutions for authentication system
 */
/**
 * Distributed token caching with Redis Cluster support
 * Handles 50K+ concurrent users with sub-millisecond latency
 */
export declare class DistributedTokenCache {
    private static instance;
    private redis;
    private constructor();
    static getInstance(): DistributedTokenCache;
    private initializeRedis;
    /**
     * Cache access token with distributed invalidation
     */
    cacheAccessToken(token: string, payload: any, ttlSeconds?: number): Promise<void>;
    /**
     * Get cached access token
     */
    getCachedAccessToken(token: string): Promise<any | null>;
    /**
     * Invalidate single access token
     */
    invalidateAccessToken(token: string): Promise<void>;
    /**
     * Invalidate all tokens for a user (logout all devices)
     */
    invalidateAllUserTokens(userId: number): Promise<void>;
    /**
     * Distributed rate limiting with sliding window
     */
    checkDistributedRateLimit(identifier: string, maxRequests: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetIn: number;
    }>;
}
/**
 * Database sharding for horizontal scaling
 * Supports user-based sharding for authentication data
 */
export declare class DatabaseShardingManager {
    private static instance;
    private shardCount;
    private constructor();
    static getInstance(): DatabaseShardingManager;
    /**
     * Get shard ID for user ID (consistent hashing)
     */
    getShardForUser(userId: number): number;
    /**
     * Get database connection for shard
     */
    getShardConnection(shardId: number): any;
    /**
     * Execute query on appropriate shard
     */
    executeOnShard(userId: number, query: any): Promise<any>;
}
/**
 * Circuit breaker pattern for external service calls
 */
export declare class CircuitBreaker {
    private failureThreshold;
    private recoveryTimeout;
    private monitoringPeriod;
    private failures;
    private lastFailureTime;
    private state;
    constructor(failureThreshold?: number, recoveryTimeout?: number, // 1 minute
    monitoringPeriod?: number);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): {
        state: "CLOSED" | "OPEN" | "HALF_OPEN";
        failures: number;
        lastFailureTime: number;
    };
}
/**
 * Comprehensive monitoring for authentication system
 */
export declare class AuthMonitoringService {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): AuthMonitoringService;
    private initializeMetrics;
    /**
     * Record authentication event
     */
    recordAuthEvent(type: string, success: boolean, duration?: number): void;
    /**
     * Record cache operation
     */
    recordCacheOperation(hit: boolean): void;
    /**
     * Record security event
     */
    recordSecurityEvent(type: string): void;
    /**
     * Record performance metrics
     */
    recordPerformance(operation: string, duration: number): void;
    /**
     * Get current metrics
     */
    getMetrics(): any;
    /**
     * Get health status
     */
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, any>;
    }>;
    /**
     * Periodic cleanup of old metrics
     */
    private startPeriodicCleanup;
}
/**
 * Auto-scaling decision support
 */
export declare class AutoScalingManager {
    private static instance;
    private monitoring;
    private constructor();
    static getInstance(): AutoScalingManager;
    /**
     * Calculate scaling recommendations
     */
    getScalingRecommendation(): {
        scaleUp: boolean;
        scaleDown: boolean;
        reason: string;
        metrics: any;
    };
}
export declare const distributedCache: DistributedTokenCache;
export declare const dbSharding: DatabaseShardingManager;
export declare const monitoring: AuthMonitoringService;
export declare const autoScaling: AutoScalingManager;
export declare const externalServiceCircuitBreaker: CircuitBreaker;
