/**
 * Hash a password using bcrypt
 * Note: In production, use bcrypt library
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a password with a hash
 */
export declare function comparePassword(password: string, storedHash: string): Promise<boolean>;
/**
 * Generate a JWT token
 * Note: In production, use jsonwebtoken library
 */
export declare function signToken(payload: object): string;
/**
 * Verify a JWT token
 */
export declare function verifyToken(token: string): {
    valid: boolean;
    payload?: any;
    error?: string;
};
/**
 * Extract token from Authorization header
 */
export declare function extractToken(authHeader?: string): string | null;
/**
 * Sanitize user input to prevent XSS
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate password strength
 */
export declare function isStrongPassword(password: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Check if request exceeds rate limit
 */
export declare function checkRateLimit(identifier: string, maxRequests?: number, windowMs?: number): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
};
/**
 * Get allowed origins for CORS
 */
export declare function getCorsOrigins(): string[];
/**
 * Validate origin against allowed list
 */
export declare function isOriginAllowed(origin: string | undefined): boolean;
/**
 * Get security headers for response
 */
export declare function getSecurityHeaders(): {
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'Strict-Transport-Security': string;
    'Content-Security-Policy': string;
};
/**
 * Encrypt sensitive data
 */
export declare function encrypt(text: string): string;
/**
 * Decrypt sensitive data
 */
export declare function decrypt(text: string): string;
declare const _default: {
    hashPassword: typeof hashPassword;
    comparePassword: typeof comparePassword;
    signToken: typeof signToken;
    verifyToken: typeof verifyToken;
    extractToken: typeof extractToken;
    sanitizeInput: typeof sanitizeInput;
    isValidEmail: typeof isValidEmail;
    isStrongPassword: typeof isStrongPassword;
    checkRateLimit: typeof checkRateLimit;
    getCorsOrigins: typeof getCorsOrigins;
    isOriginAllowed: typeof isOriginAllowed;
    getSecurityHeaders: typeof getSecurityHeaders;
    encrypt: typeof encrypt;
    decrypt: typeof decrypt;
};
export default _default;
