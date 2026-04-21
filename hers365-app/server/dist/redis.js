// Redis caching for session management and token caching
// Required for 50K concurrent user scale
import { createClient } from 'redis';
let redisClient = null;
export async function getRedisClient() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    return redisClient;
}
// Token caching functions
export async function cacheToken(token, userId, ttlSeconds = 300) {
    const client = await getRedisClient();
    await client.setEx(`token:${token}`, ttlSeconds, userId);
}
export async function getCachedToken(token) {
    const client = await getRedisClient();
    return await client.get(`token:${token}`);
}
export async function invalidateToken(token) {
    const client = await getRedisClient();
    await client.del(`token:${token}`);
}
// Session caching
export async function cacheSession(sessionId, data, ttlSeconds = 3600) {
    const client = await getRedisClient();
    await client.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
}
export async function getSession(sessionId) {
    const client = await getRedisClient();
    const data = await client.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
}
//# sourceMappingURL=redis.js.map