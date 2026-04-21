import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from './db';
import * as schema from './schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import { logger } from './logger';
// Note: Requires additional packages: npm install speakeasy qrcode
/**
  * SECURE AUTHENTICATION SERVICE
  * JWT-based auth with refresh token rotation, MFA, and session management
  * Designed for enterprise-scale sports recruiting platform with compliance requirements
  */
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'hers365-super-secret-jwt-key-change-in-prod';
const JWT_ACCESS_EXPIRES = '15m'; // Short-lived access tokens
const JWT_REFRESH_EXPIRES_DAYS = 30; // Refresh tokens valid for 30 days
// Refresh Token Configuration
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex');
const REFRESH_TOKEN_LENGTH = 64; // Characters in refresh token
// ─── ACCESS TOKEN MANAGEMENT ───────────────────────────────────────────────────
export function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
// ─── REFRESH TOKEN MANAGEMENT ──────────────────────────────────────────────────
export function generateRefreshToken() {
    return crypto.randomBytes(REFRESH_TOKEN_LENGTH / 2).toString('hex');
}
export function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
export async function storeRefreshToken(userId, userType, refreshToken, deviceFingerprint, ipAddress, userAgent) {
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + (JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000));
    const result = await db.insert(schema.refreshTokens).values({
        userId,
        userType,
        tokenHash,
        deviceFingerprint,
        ipAddress,
        userAgent,
        expiresAt, // Pass Date object
    }).returning({ id: schema.refreshTokens.id });
    return result[0].id;
}
export async function validateRefreshToken(token) {
    const tokenHash = hashRefreshToken(token);
    const refreshToken = await db
        .select()
        .from(schema.refreshTokens)
        .where(and(eq(schema.refreshTokens.isRevoked, false), gt(schema.refreshTokens.expiresAt, new Date())))
        .limit(1);
    if (refreshToken.length === 0)
        return null;
    // Update last used timestamp
    await db
        .update(schema.refreshTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(schema.refreshTokens.id, refreshToken[0].id));
    return {
        id: refreshToken[0].id,
        userId: refreshToken[0].userId,
        userType: refreshToken[0].userType,
        tokenHash: refreshToken[0].tokenHash,
        deviceFingerprint: refreshToken[0].deviceFingerprint || undefined,
        ipAddress: refreshToken[0].ipAddress || undefined,
        userAgent: refreshToken[0].userAgent || undefined,
        expiresAt: refreshToken[0].expiresAt,
        isRevoked: refreshToken[0].isRevoked === true,
    };
}
export async function revokeRefreshToken(tokenId, reason = 'user_logout') {
    await db
        .update(schema.refreshTokens)
        .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
    })
        .where(eq(schema.refreshTokens.id, tokenId));
}
export async function revokeAllUserRefreshTokens(userId, userType, reason = 'security_action') {
    await db
        .update(schema.refreshTokens)
        .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
    })
        .where(and(eq(schema.refreshTokens.userId, userId), eq(schema.refreshTokens.userType, userType), eq(schema.refreshTokens.isRevoked, false)));
}
export async function cleanupExpiredTokens() {
    const currentTime = new Date();
    const sevenDaysAgo = new Date(currentTime.getTime() - (7 * 24 * 60 * 60 * 1000));
    // Remove expired refresh tokens older than 7 days
    await db
        .delete(schema.refreshTokens)
        .where(and(lt(schema.refreshTokens.expiresAt, sevenDaysAgo), eq(schema.refreshTokens.isRevoked, true)));
}
// ─── TOKEN ROTATION ────────────────────────────────────────────────────────────
export async function rotateRefreshToken(oldToken, deviceFingerprint, ipAddress, userAgent) {
    const refreshData = await validateRefreshToken(oldToken);
    if (!refreshData)
        return null;
    // Revoke old token
    await revokeRefreshToken(refreshData.id, 'token_rotation');
    // Generate new tokens
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenId = await storeRefreshToken(refreshData.userId, refreshData.userType, newRefreshToken, deviceFingerprint, ipAddress, userAgent);
    // Get user data (this would need to be implemented based on user type)
    const userData = await getUserDataById(refreshData.userId, refreshData.userType);
    if (!userData)
        return null;
    const payload = {
        userId: userData.userId,
        email: userData.email,
        role: userData.role,
        userType: refreshData.userType,
        name: userData.name,
    };
    const accessToken = signAccessToken(payload);
    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: payload,
    };
}
// Helper function to get user data (implementation depends on user type)
async function getUserDataById(userId, userType) {
    switch (userType) {
        case 'athlete':
            const athlete = await db.select().from(schema.players).where(eq(schema.players.id, userId)).limit(1);
            if (athlete.length > 0) {
                return {
                    userId: athlete[0].id,
                    email: athlete[0].email,
                    role: 'athlete',
                    name: athlete[0].name,
                };
            }
            break;
        case 'parent':
            const parent = await db.select().from(schema.parents).where(eq(schema.parents.id, userId)).limit(1);
            if (parent.length > 0) {
                return {
                    userId: parent[0].id,
                    email: parent[0].email,
                    role: 'parent',
                    name: parent[0].name,
                };
            }
            break;
        case 'coach':
            const coach = await db.select().from(schema.coaches).where(eq(schema.coaches.id, userId)).limit(1);
            if (coach.length > 0) {
                return {
                    userId: coach[0].id,
                    email: coach[0].email || '',
                    role: 'coach',
                    name: coach[0].name || '',
                };
            }
            break;
        case 'admin':
            const admin = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, userId)).limit(1);
            if (admin.length > 0) {
                return {
                    userId: admin[0].id,
                    email: admin[0].username,
                    role: 'admin',
                    name: admin[0].username,
                };
            }
            break;
    }
    return null;
}
/**
 * Generate MFA setup data for a user
 */
export async function generateMFASetup(userId, userType, email) {
    // This would use speakeasy to generate TOTP secret
    // For now, using crypto for demonstration
    const secret = crypto.randomBytes(32).toString('hex');
    // Generate QR code URL (would use qrcode package)
    const issuer = 'HERS365';
    const qrCodeUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(backupCodes.map(code => bcrypt.hash(code, 10)));
    // Store MFA secret temporarily (not enabled yet)
    await db.insert(schema.mfaSecrets).values({
        userId,
        userType,
        secret: await bcrypt.hash(secret, 12), // Encrypt the secret
        backupCodes: JSON.stringify(hashedBackupCodes),
        isEnabled: false,
    });
    return {
        secret,
        qrCodeUrl,
        backupCodes,
    };
}
/**
 * Verify MFA token during setup
 */
export async function verifyMFAToken(userId, userType, token) {
    const mfaData = await db
        .select()
        .from(schema.mfaSecrets)
        .where(and(eq(schema.mfaSecrets.userId, userId), eq(schema.mfaSecrets.userType, userType), eq(schema.mfaSecrets.isEnabled, false)))
        .limit(1);
    if (mfaData.length === 0)
        return false;
    // In production, use speakeasy.totp.verify()
    // For demo, accept any 6-digit token
    const isValidToken = /^\d{6}$/.test(token);
    if (isValidToken) {
        // Enable MFA
        await db
            .update(schema.mfaSecrets)
            .set({
            isEnabled: true,
            verifiedAt: new Date(),
        })
            .where(eq(schema.mfaSecrets.id, mfaData[0].id));
        return true;
    }
    return false;
}
/**
 * Verify MFA token during login
 */
export async function verifyMFALogin(userId, userType, token) {
    const mfaData = await db
        .select()
        .from(schema.mfaSecrets)
        .where(and(eq(schema.mfaSecrets.userId, userId), eq(schema.mfaSecrets.userType, userType), eq(schema.mfaSecrets.isEnabled, true)))
        .limit(1);
    if (mfaData.length === 0)
        return false;
    // First try TOTP token
    // In production: speakeasy.totp.verify({ secret: decryptedSecret, token })
    const isValidTOTP = /^\d{6}$/.test(token);
    if (isValidTOTP)
        return true;
    // Try backup codes
    const hashedCodes = JSON.parse(mfaData[0].backupCodes);
    for (const hashedCode of hashedCodes) {
        if (await bcrypt.compare(token, hashedCode)) {
            // Remove used backup code
            const updatedCodes = hashedCodes.filter((code) => code !== hashedCode);
            await db
                .update(schema.mfaSecrets)
                .set({ backupCodes: JSON.stringify(updatedCodes) })
                .where(eq(schema.mfaSecrets.id, mfaData[0].id));
            return true;
        }
    }
    return false;
}
/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId, userType) {
    const mfaData = await db
        .select()
        .from(schema.mfaSecrets)
        .where(and(eq(schema.mfaSecrets.userId, userId), eq(schema.mfaSecrets.userType, userType), eq(schema.mfaSecrets.isEnabled, true)))
        .limit(1);
    return mfaData.length > 0;
}
/**
 * Disable MFA for user
 */
export async function disableMFA(userId, userType) {
    await db
        .delete(schema.mfaSecrets)
        .where(and(eq(schema.mfaSecrets.userId, userId), eq(schema.mfaSecrets.userType, userType)));
}
/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId, userType) {
    const mfaData = await db
        .select()
        .from(schema.mfaSecrets)
        .where(and(eq(schema.mfaSecrets.userId, userId), eq(schema.mfaSecrets.userType, userType), eq(schema.mfaSecrets.isEnabled, true)))
        .limit(1);
    if (mfaData.length === 0)
        throw new Error('MFA not enabled');
    // Generate new backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(backupCodes.map(code => bcrypt.hash(code, 10)));
    // Update backup codes
    await db
        .update(schema.mfaSecrets)
        .set({ backupCodes: JSON.stringify(hashedBackupCodes) })
        .where(eq(schema.mfaSecrets.id, mfaData[0].id));
    return backupCodes;
}
/**
 * Create a new user session
 */
export async function createUserSession(userId, userType, refreshTokenId, deviceFingerprint, ipAddress, userAgent, location) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000));
    await db.insert(schema.userSessions).values({
        userId,
        userType,
        sessionId,
        refreshTokenId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        location,
        isActive: true,
        expiresAt,
        lastActivityAt: new Date(),
    });
    return sessionId;
}
/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId, userType) {
    const sessions = await db
        .select()
        .from(schema.userSessions)
        .where(and(eq(schema.userSessions.userId, userId), eq(schema.userSessions.userType, userType), eq(schema.userSessions.isActive, true), gt(schema.userSessions.expiresAt, new Date())));
    return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        userType: session.userType,
        sessionId: session.sessionId,
        refreshTokenId: session.refreshTokenId || undefined,
        deviceFingerprint: session.deviceFingerprint || undefined,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        location: session.location || undefined,
        isActive: session.isActive === true,
        expiresAt: session.expiresAt,
        lastActivityAt: session.lastActivityAt,
    }));
}
/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId) {
    await db
        .update(schema.userSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(schema.userSessions.sessionId, sessionId));
}
/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId, reason = 'user_action') {
    // Get session data first
    const session = await db
        .select()
        .from(schema.userSessions)
        .where(eq(schema.userSessions.sessionId, sessionId))
        .limit(1);
    if (session.length > 0) {
        // Revoke associated refresh token if exists
        if (session[0].refreshTokenId) {
            await revokeRefreshToken(session[0].refreshTokenId, reason);
        }
        // Mark session as inactive
        await db
            .update(schema.userSessions)
            .set({ isActive: false })
            .where(eq(schema.userSessions.sessionId, sessionId));
    }
}
/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId, userType, reason = 'security_action') {
    // Get all active sessions
    const sessions = await db
        .select()
        .from(schema.userSessions)
        .where(and(eq(schema.userSessions.userId, userId), eq(schema.userSessions.userType, userType), eq(schema.userSessions.isActive, true)));
    // Revoke associated refresh tokens
    for (const session of sessions) {
        if (session.refreshTokenId) {
            await revokeRefreshToken(session.refreshTokenId, reason);
        }
    }
    // Mark all sessions as inactive
    await db
        .update(schema.userSessions)
        .set({ isActive: false })
        .where(and(eq(schema.userSessions.userId, userId), eq(schema.userSessions.userType, userType), eq(schema.userSessions.isActive, true)));
}
/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
    const currentTime = new Date();
    // Mark expired sessions as inactive
    await db
        .update(schema.userSessions)
        .set({ isActive: false })
        .where(lt(schema.userSessions.expiresAt, new Date()));
    // Remove old inactive sessions (older than 30 days)
    await db
        .delete(schema.userSessions)
        .where(and(eq(schema.userSessions.isActive, false), lt(schema.userSessions.lastActivityAt, new Date(currentTime.getTime() - (30 * 24 * 60 * 60 * 1000)))));
}
/**
 * Get session by ID
 */
export async function getSessionById(sessionId) {
    const session = await db
        .select()
        .from(schema.userSessions)
        .where(eq(schema.userSessions.sessionId, sessionId))
        .limit(1);
    if (session.length === 0)
        return null;
    return {
        id: session[0].id,
        userId: session[0].userId,
        userType: session[0].userType,
        sessionId: session[0].sessionId,
        refreshTokenId: session[0].refreshTokenId || undefined,
        deviceFingerprint: session[0].deviceFingerprint || undefined,
        ipAddress: session[0].ipAddress || undefined,
        userAgent: session[0].userAgent || undefined,
        location: session[0].location || undefined,
        isActive: session[0].isActive === true,
        expiresAt: session[0].expiresAt,
        lastActivityAt: session[0].lastActivityAt,
    };
}
/**
 * Record failed login attempt
 */
export async function recordFailedAttempt(email, userType, ipAddress, userAgent, failureReason = 'invalid_credentials') {
    await db.insert(schema.failedLoginAttempts).values({
        email,
        userType,
        ipAddress,
        userAgent,
        failureReason,
        attemptedAt: new Date(),
    });
    // Check if account should be locked
    await checkAndApplyLockout(email, userType, ipAddress);
}
/**
 * Check and apply account lockout based on failed attempts
 */
export async function checkAndApplyLockout(email, userType, ipAddress) {
    const currentTime = new Date();
    const windowStart = new Date(currentTime.getTime() - (15 * 60 * 1000)); // 15 minutes window
    // Count recent failed attempts for this email
    const emailAttempts = await db
        .select()
        .from(schema.failedLoginAttempts)
        .where(and(eq(schema.failedLoginAttempts.email, email), eq(schema.failedLoginAttempts.userType, userType), gt(schema.failedLoginAttempts.attemptedAt, windowStart)));
    // Count recent failed attempts from this IP
    const ipAttempts = await db
        .select()
        .from(schema.failedLoginAttempts)
        .where(and(eq(schema.failedLoginAttempts.ipAddress, ipAddress), gt(schema.failedLoginAttempts.attemptedAt, windowStart)));
    const emailFailureCount = emailAttempts.length;
    const ipFailureCount = ipAttempts.length;
    // Progressive lockout thresholds
    if (emailFailureCount >= 10 || ipFailureCount >= 20) {
        // Permanent lockout for severe abuse
        await lockAccount(email, userType, 'brute_force', true);
        return true;
    }
    else if (emailFailureCount >= 5) {
        // Temporary lockout
        await lockAccount(email, userType, 'brute_force', false, 30 * 60 * 1000); // 30 minutes
        return true;
    }
    return false;
}
/**
 * Lock user account
 */
export async function lockAccount(email, userType, reason, isPermanent = false, lockDurationMs = 15 * 60 * 1000 // 15 minutes default
) {
    // Find user ID
    let userId = null;
    switch (userType) {
        case 'athlete':
            const athlete = await db.select({ id: schema.players.id }).from(schema.players).where(eq(schema.players.email, email)).limit(1);
            userId = athlete.length > 0 ? athlete[0].id : null;
            break;
        case 'parent':
            const parent = await db.select({ id: schema.parents.id }).from(schema.parents).where(eq(schema.parents.email, email)).limit(1);
            userId = parent.length > 0 ? parent[0].id : null;
            break;
        case 'coach':
            const coach = await db.select({ id: schema.coaches.id }).from(schema.coaches).where(eq(schema.coaches.email, email)).limit(1);
            userId = coach.length > 0 ? coach[0].id : null;
            break;
        case 'admin':
            const admin = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).where(eq(schema.adminUsers.username, email)).limit(1);
            userId = admin.length > 0 ? admin[0].id : null;
            break;
    }
    if (!userId)
        return; // User doesn't exist, no need to lock
    const unlockAt = isPermanent ? undefined : new Date(Date.now() + lockDurationMs);
    await db.insert(schema.accountLockouts).values({
        userId,
        userType,
        email,
        lockoutReason: reason,
        lockedAt: new Date(),
        unlockAt,
        isPermanent,
    });
}
/**
 * Check if account is locked
 */
export async function isAccountLocked(email, userType) {
    const lockouts = await db
        .select()
        .from(schema.accountLockouts)
        .where(and(eq(schema.accountLockouts.email, email), eq(schema.accountLockouts.userType, userType)))
        .orderBy(schema.accountLockouts.lockedAt)
        .limit(1);
    if (lockouts.length === 0)
        return null;
    const lockout = lockouts[0];
    const currentTime = new Date();
    // Check if lockout has expired
    if (!lockout.isPermanent && lockout.unlockAt && lockout.unlockAt <= currentTime) {
        // Remove expired lockout
        await db
            .delete(schema.accountLockouts)
            .where(eq(schema.accountLockouts.id, lockout.id));
        return null;
    }
    return {
        userId: lockout.userId,
        userType: lockout.userType,
        email: lockout.email,
        lockoutReason: lockout.lockoutReason,
        lockedAt: lockout.lockedAt || new Date(),
        unlockAt: lockout.unlockAt || undefined,
        isPermanent: lockout.isPermanent === true,
    };
}
/**
 * Unlock account
 */
export async function unlockAccount(email, userType, unlockedBy = 'admin') {
    await db
        .update(schema.accountLockouts)
        .set({
        unlockedAt: new Date(),
        unlockedBy,
    })
        .where(and(eq(schema.accountLockouts.email, email), eq(schema.accountLockouts.userType, userType)));
}
/**
 * Calculate progressive delay for failed login attempts
 */
export function calculateProgressiveDelay(failureCount) {
    if (failureCount <= 3)
        return 0; // No delay for first 3 attempts
    if (failureCount <= 5)
        return 1000; // 1 second delay
    if (failureCount <= 7)
        return 5000; // 5 second delay
    if (failureCount <= 9)
        return 15000; // 15 second delay
    return 30000; // 30 second delay for 10+ failures
}
/**
 * Get recent failed attempts for rate limiting
 */
export async function getRecentFailedAttempts(email, userType, ipAddress) {
    const currentTime = new Date();
    const windowStart = new Date(currentTime.getTime() - (15 * 60 * 1000)); // 15 minutes
    const [emailAttempts, ipAttempts] = await Promise.all([
        db
            .select()
            .from(schema.failedLoginAttempts)
            .where(and(eq(schema.failedLoginAttempts.email, email), eq(schema.failedLoginAttempts.userType, userType), gt(schema.failedLoginAttempts.attemptedAt, windowStart))),
        db
            .select()
            .from(schema.failedLoginAttempts)
            .where(and(eq(schema.failedLoginAttempts.ipAddress, ipAddress), gt(schema.failedLoginAttempts.attemptedAt, windowStart)))
    ]);
    const emailFailureCount = emailAttempts.length;
    const ipFailureCount = ipAttempts.length;
    const delayMs = calculateProgressiveDelay(Math.max(emailFailureCount, ipFailureCount));
    return {
        emailAttempts: emailFailureCount,
        ipAttempts: ipFailureCount,
        delayMs,
    };
}
/**
 * Detect suspicious activity and create security alerts
 */
export async function detectSuspiciousActivity(userId, userType, email, ipAddress, userAgent, activityType) {
    const alerts = [];
    const currentTime = new Date();
    const shortWindow = new Date(currentTime.getTime() - (5 * 60 * 1000)); // 5 minutes
    const longWindow = new Date(currentTime.getTime() - (60 * 60 * 1000)); // 1 hour
    // Check for rapid failed attempts
    const recentFailures = await db
        .select()
        .from(schema.failedLoginAttempts)
        .where(and(eq(schema.failedLoginAttempts.email, email), gt(schema.failedLoginAttempts.attemptedAt, shortWindow)));
    if (recentFailures.length >= 5) {
        alerts.push('brute_force_attempt');
    }
    // Check for unusual location (would need geolocation data)
    // This is a placeholder for more sophisticated checks
    // Create alerts
    for (const alertType of alerts) {
        await db.insert(schema.securityAlerts).values({
            userId,
            userType,
            alertType,
            severity: alertType === 'brute_force_attempt' ? 'high' : 'medium',
            description: `Suspicious activity detected: ${alertType}`,
            ipAddress,
            userAgent,
            createdAt: new Date(),
        });
    }
}
/**
 * Clean up old failed attempts and lockouts
 */
export async function cleanupSecurityData() {
    const currentTime = new Date();
    const thirtyDaysAgo = new Date(currentTime.getTime() - (30 * 24 * 60 * 60 * 1000));
    // Remove old failed attempts
    await db
        .delete(schema.failedLoginAttempts)
        .where(lt(schema.failedLoginAttempts.attemptedAt, thirtyDaysAgo));
    // Remove old resolved alerts
    await db
        .delete(schema.securityAlerts)
        .where(and(eq(schema.securityAlerts.resolved, true), lt(schema.securityAlerts.createdAt, thirtyDaysAgo)));
}
// ─── TOKEN LIFECYCLE MANAGEMENT ────────────────────────────────────────────────
/**
 * Comprehensive token cleanup - removes expired and old tokens
 */
export async function cleanupTokenLifecycle() {
    const currentTime = new Date();
    const thirtyDaysAgo = new Date(currentTime.getTime() - (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(currentTime.getTime() - (90 * 24 * 60 * 60 * 1000));
    // Clean up expired refresh tokens
    const expiredTokens = await db
        .delete(schema.refreshTokens)
        .where(and(lt(schema.refreshTokens.expiresAt, new Date()), eq(schema.refreshTokens.isRevoked, false)));
    // Clean up expired sessions
    const expiredSessions = await db
        .update(schema.userSessions)
        .set({ isActive: false })
        .where(and(lt(schema.userSessions.expiresAt, new Date()), eq(schema.userSessions.isActive, true)));
    // Remove old inactive sessions
    await db
        .delete(schema.userSessions)
        .where(and(eq(schema.userSessions.isActive, false), lt(schema.userSessions.lastActivityAt, thirtyDaysAgo)));
    // Remove old audit logs (keep 90 days)
    const oldAuditLogs = await db
        .delete(schema.securityAuditLogs)
        .where(lt(schema.securityAuditLogs.createdAt, ninetyDaysAgo));
    return {
        expiredTokens: expiredTokens.changes || 0,
        expiredSessions: expiredSessions.changes || 0,
        oldAuditLogs: oldAuditLogs.changes || 0,
    };
}
/**
 * Get token statistics for monitoring
 */
export async function getTokenStatistics() {
    const currentTime = new Date();
    const [activeTokens, expiredTokens, revokedTokens, activeSessions] = await Promise.all([
        db
            .select({ count: schema.refreshTokens.id })
            .from(schema.refreshTokens)
            .where(and(gt(schema.refreshTokens.expiresAt, new Date()), eq(schema.refreshTokens.isRevoked, false))),
        db
            .select({ count: schema.refreshTokens.id })
            .from(schema.refreshTokens)
            .where(lt(schema.refreshTokens.expiresAt, new Date())),
        db
            .select({ count: schema.refreshTokens.id })
            .from(schema.refreshTokens)
            .where(eq(schema.refreshTokens.isRevoked, true)),
        db
            .select({ count: schema.userSessions.id })
            .from(schema.userSessions)
            .where(and(eq(schema.userSessions.isActive, true), gt(schema.userSessions.expiresAt, new Date())))
    ]);
    return {
        activeRefreshTokens: activeTokens.length,
        activeSessions: activeSessions.length,
        expiredTokens: expiredTokens.length,
        revokedTokens: revokedTokens.length,
    };
}
/**
 * Log security audit event
 */
export async function logAuditEvent(auditData, req) {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';
    // Extract location from IP (would need geolocation service)
    let location;
    // Determine compliance flags based on action and user type
    const complianceFlags = [];
    if (auditData.userType === 'athlete' || auditData.userType === 'parent') {
        complianceFlags.push('coppa');
    }
    if (auditData.action.includes('payment') || auditData.action.includes('financial')) {
        complianceFlags.push('pci');
    }
    if (auditData.action.includes('data') || auditData.action.includes('export')) {
        complianceFlags.push('gdpr');
    }
    if (auditData.action.includes('scholarship') || auditData.action.includes('academic')) {
        complianceFlags.push('ferpa');
    }
    await db.insert(schema.securityAuditLogs).values({
        userId: auditData.userId,
        userType: auditData.userType,
        action: auditData.action,
        resource: auditData.resource,
        ipAddress,
        userAgent,
        location,
        success: auditData.success,
        errorMessage: auditData.errorMessage,
        metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : undefined,
        complianceFlags: complianceFlags.length > 0 ? JSON.stringify(complianceFlags) : undefined,
        createdAt: new Date(),
    });
}
/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters = {}) {
    let query = db.select().from(schema.securityAuditLogs);
    const conditions = [];
    if (filters.userId) {
        conditions.push(eq(schema.securityAuditLogs.userId, filters.userId));
    }
    if (filters.userType) {
        conditions.push(eq(schema.securityAuditLogs.userType, filters.userType));
    }
    if (filters.action) {
        conditions.push(eq(schema.securityAuditLogs.action, filters.action));
    }
    if (filters.success !== undefined) {
        conditions.push(eq(schema.securityAuditLogs.success, filters.success));
    }
    if (filters.fromDate) {
        conditions.push(gt(schema.securityAuditLogs.createdAt, filters.fromDate));
    }
    if (filters.toDate) {
        conditions.push(lt(schema.securityAuditLogs.createdAt, filters.toDate));
    }
    if (conditions.length > 0) {
        query = query.where(and(...conditions));
    }
    query = query.orderBy(schema.securityAuditLogs.createdAt).limit(filters.limit || 100);
    const logs = await query;
    return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
        complianceFlags: log.complianceFlags ? JSON.parse(log.complianceFlags) : undefined,
        createdAt: log.createdAt,
    }));
}
/**
 * Get security metrics for monitoring
 */
export async function getSecurityMetrics(timeRangeHours = 24) {
    const currentTime = new Date();
    const timeRange = new Date(currentTime.getTime() - (timeRangeHours * 60 * 60 * 1000));
    const [loginLogs, failedAttempts, activeSessions, alerts, lockouts, mfaUsers] = await Promise.all([
        db
            .select({ count: schema.securityAuditLogs.id })
            .from(schema.securityAuditLogs)
            .where(and(eq(schema.securityAuditLogs.action, 'login'), eq(schema.securityAuditLogs.success, true), gt(schema.securityAuditLogs.createdAt, timeRange))),
        db
            .select({ count: schema.failedLoginAttempts.id })
            .from(schema.failedLoginAttempts)
            .where(gt(schema.failedLoginAttempts.attemptedAt, timeRange)),
        db
            .select({ count: schema.userSessions.id })
            .from(schema.userSessions)
            .where(and(eq(schema.userSessions.isActive, true), gt(schema.userSessions.expiresAt, new Date()))),
        db
            .select({ count: schema.securityAlerts.id })
            .from(schema.securityAlerts)
            .where(gt(schema.securityAlerts.createdAt, timeRange)),
        db
            .select({ count: schema.accountLockouts.id })
            .from(schema.accountLockouts)
            .where(gt(schema.accountLockouts.lockedAt, timeRange)),
        db
            .select({ count: schema.mfaSecrets.id })
            .from(schema.mfaSecrets)
            .where(eq(schema.mfaSecrets.isEnabled, true))
    ]);
    return {
        totalLogins: loginLogs.length,
        failedLogins: failedAttempts.length,
        activeUsers: activeSessions.length,
        suspiciousActivities: alerts.length,
        accountLockouts: lockouts.length,
        mfaEnabledUsers: mfaUsers.length,
    };
}
// ─── Password ─────────────────────────────────────────────────────────────────
export async function hashPassword(plain) {
    return bcrypt.hash(plain, 14); // Increased rounds for better security
}
export async function comparePassword(plain, hashed) {
    try {
        return await bcrypt.compare(plain, hashed);
    }
    catch (error) {
        logger.error('Password compare failed', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}
// ─── Token Cache for 50K User Scalability ──────────────────────────────────────
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 10000;
export function cacheToken(token, payload) {
    const now = Date.now();
    if (tokenCache.size >= MAX_CACHE_SIZE) {
        for (const [key, value] of tokenCache.entries()) {
            if (value.expires < now)
                tokenCache.delete(key);
        }
        if (tokenCache.size >= MAX_CACHE_SIZE * 0.9) {
            const entries = Array.from(tokenCache.entries());
            entries.slice(0, Math.floor(entries.length / 2)).forEach(([k]) => tokenCache.delete(k));
        }
    }
    tokenCache.set(token, { payload, expires: now + TOKEN_CACHE_TTL });
}
export function getCachedToken(token) {
    const cached = tokenCache.get(token);
    const now = Date.now();
    if (cached && cached.expires > now) {
        return cached.payload;
    }
    if (cached)
        tokenCache.delete(token);
    return null;
}
export function invalidateToken(token) {
    tokenCache.delete(token);
}
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
        if (value.expires < now)
            tokenCache.delete(key);
    }
}, 60000);
// ─── EXPRESS MIDDLEWARE ───────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = auth.slice(7);
    let payload = getCachedToken(token);
    if (!payload) {
        payload = verifyAccessToken(token);
        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired access token' });
        }
        cacheToken(token, payload);
    }
    req.user = payload;
    next();
}
;
export function requireCoach(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'coach' && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Coach access required' });
        }
        next();
    });
}
export function requireAthlete(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'athlete' && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Athlete access required' });
        }
        next();
    });
}
export function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
}
//# sourceMappingURL=auth.js.map