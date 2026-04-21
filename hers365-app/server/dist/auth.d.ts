import { Request, Response, NextFunction } from 'express';
export type UserRole = 'athlete' | 'coach' | 'admin' | 'parent';
export type UserType = 'athlete' | 'parent' | 'coach' | 'admin';
export type TokenPayload = {
    userId: number;
    email: string;
    role: UserRole;
    userType: UserType;
    name: string;
    sessionId?: string;
    mfaVerified?: boolean;
};
export type RefreshTokenData = {
    id: number;
    userId: number;
    userType: UserType;
    tokenHash: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    isRevoked: boolean;
};
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
export declare function signAccessToken(payload: Omit<TokenPayload, 'sessionId' | 'mfaVerified'>): string;
export declare function verifyAccessToken(token: string): TokenPayload | null;
export declare function generateRefreshToken(): string;
export declare function hashRefreshToken(token: string): string;
export declare function storeRefreshToken(userId: number, userType: UserType, refreshToken: string, deviceFingerprint?: string, ipAddress?: string, userAgent?: string): Promise<number>;
export declare function validateRefreshToken(token: string): Promise<RefreshTokenData | null>;
export declare function revokeRefreshToken(tokenId: number, reason?: string): Promise<void>;
export declare function revokeAllUserRefreshTokens(userId: number, userType: UserType, reason?: string): Promise<void>;
export declare function cleanupExpiredTokens(): Promise<void>;
export declare function rotateRefreshToken(oldToken: string, deviceFingerprint?: string, ipAddress?: string, userAgent?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: TokenPayload;
} | null>;
export type MFASetupData = {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
};
export type MFASecretData = {
    id: number;
    userId: number;
    userType: UserType;
    secret: string;
    backupCodes: string[];
    isEnabled: boolean;
};
/**
 * Generate MFA setup data for a user
 */
export declare function generateMFASetup(userId: number, userType: UserType, email: string): Promise<MFASetupData>;
/**
 * Verify MFA token during setup
 */
export declare function verifyMFAToken(userId: number, userType: UserType, token: string): Promise<boolean>;
/**
 * Verify MFA token during login
 */
export declare function verifyMFALogin(userId: number, userType: UserType, token: string): Promise<boolean>;
/**
 * Check if user has MFA enabled
 */
export declare function isMFAEnabled(userId: number, userType: UserType): Promise<boolean>;
/**
 * Disable MFA for user
 */
export declare function disableMFA(userId: number, userType: UserType): Promise<void>;
/**
 * Regenerate backup codes
 */
export declare function regenerateBackupCodes(userId: number, userType: UserType): Promise<string[]>;
export type SessionData = {
    id: number;
    userId: number;
    userType: UserType;
    sessionId: string;
    refreshTokenId?: number;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    isActive: boolean;
    expiresAt: Date;
    lastActivityAt: Date;
};
/**
 * Create a new user session
 */
export declare function createUserSession(userId: number, userType: UserType, refreshTokenId?: number, deviceFingerprint?: string, ipAddress?: string, userAgent?: string, location?: string): Promise<string>;
/**
 * Get active sessions for a user
 */
export declare function getUserSessions(userId: number, userType: UserType): Promise<SessionData[]>;
/**
 * Update session activity
 */
export declare function updateSessionActivity(sessionId: string): Promise<void>;
/**
 * Revoke a specific session
 */
export declare function revokeSession(sessionId: string, reason?: string): Promise<void>;
/**
 * Revoke all sessions for a user
 */
export declare function revokeAllUserSessions(userId: number, userType: UserType, reason?: string): Promise<void>;
/**
 * Clean up expired sessions
 */
export declare function cleanupExpiredSessions(): Promise<void>;
/**
 * Get session by ID
 */
export declare function getSessionById(sessionId: string): Promise<SessionData | null>;
export type FailedAttemptData = {
    email: string;
    userType: UserType;
    ipAddress: string;
    failureReason: string;
    attemptedAt: Date;
};
export type AccountLockData = {
    userId: number;
    userType: UserType;
    email: string;
    lockoutReason: string;
    lockedAt: Date;
    unlockAt?: Date;
    isPermanent: boolean;
};
/**
 * Record failed login attempt
 */
export declare function recordFailedAttempt(email: string, userType: UserType, ipAddress: string, userAgent?: string, failureReason?: string): Promise<void>;
/**
 * Check and apply account lockout based on failed attempts
 */
export declare function checkAndApplyLockout(email: string, userType: UserType, ipAddress: string): Promise<boolean>;
/**
 * Lock user account
 */
export declare function lockAccount(email: string, userType: UserType, reason: string, isPermanent?: boolean, lockDurationMs?: number): Promise<void>;
/**
 * Check if account is locked
 */
export declare function isAccountLocked(email: string, userType: UserType): Promise<AccountLockData | null>;
/**
 * Unlock account
 */
export declare function unlockAccount(email: string, userType: UserType, unlockedBy?: string): Promise<void>;
/**
 * Calculate progressive delay for failed login attempts
 */
export declare function calculateProgressiveDelay(failureCount: number): number;
/**
 * Get recent failed attempts for rate limiting
 */
export declare function getRecentFailedAttempts(email: string, userType: UserType, ipAddress: string): Promise<{
    emailAttempts: number;
    ipAttempts: number;
    delayMs: number;
}>;
/**
 * Detect suspicious activity and create security alerts
 */
export declare function detectSuspiciousActivity(userId: number | null, userType: UserType | null, email: string, ipAddress: string, userAgent: string, activityType: string): Promise<void>;
/**
 * Clean up old failed attempts and lockouts
 */
export declare function cleanupSecurityData(): Promise<void>;
/**
 * Comprehensive token cleanup - removes expired and old tokens
 */
export declare function cleanupTokenLifecycle(): Promise<{
    expiredTokens: number;
    expiredSessions: number;
    oldAuditLogs: number;
}>;
/**
 * Get token statistics for monitoring
 */
export declare function getTokenStatistics(): Promise<{
    activeRefreshTokens: number;
    activeSessions: number;
    expiredTokens: number;
    revokedTokens: number;
}>;
export type AuditLogData = {
    userId?: number;
    userType?: UserType;
    action: string;
    resource?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    complianceFlags?: string[];
};
/**
 * Log security audit event
 */
export declare function logAuditEvent(auditData: AuditLogData, req?: Request): Promise<void>;
/**
 * Get audit logs with filtering
 */
export declare function getAuditLogs(filters?: {
    userId?: number;
    userType?: UserType;
    action?: string;
    success?: boolean;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
}): Promise<any[]>;
/**
 * Get security metrics for monitoring
 */
export declare function getSecurityMetrics(timeRangeHours?: number): Promise<{
    totalLogins: number;
    failedLogins: number;
    activeUsers: number;
    suspiciousActivities: number;
    accountLockouts: number;
    mfaEnabledUsers: number;
}>;
export declare function hashPassword(plain: string): Promise<string>;
export declare function comparePassword(plain: string, hashed: string): Promise<boolean>;
export declare function cacheToken(token: string, payload: TokenPayload): void;
export declare function getCachedToken(token: string): TokenPayload | null;
export declare function invalidateToken(token: string): void;
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireCoach(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireAthlete(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
