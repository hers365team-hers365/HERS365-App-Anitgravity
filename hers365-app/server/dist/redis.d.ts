import { RedisClientType } from 'redis';
export declare function getRedisClient(): Promise<RedisClientType>;
export declare function cacheToken(token: string, userId: string, ttlSeconds?: number): Promise<void>;
export declare function getCachedToken(token: string): Promise<string | null>;
export declare function invalidateToken(token: string): Promise<void>;
export declare function cacheSession(sessionId: string, data: object, ttlSeconds?: number): Promise<void>;
export declare function getSession(sessionId: string): Promise<object | null>;
