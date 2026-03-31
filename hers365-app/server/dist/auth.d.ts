import { Request, Response, NextFunction } from 'express';
export type UserRole = 'athlete' | 'coach' | 'admin';
export type TokenPayload = {
    userId: number;
    email: string;
    role: UserRole;
    name: string;
};
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
export declare function signToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload | null;
export declare function hashPassword(plain: string): Promise<string>;
export declare function comparePassword(plain: string, hashed: string): Promise<boolean>;
export declare function cacheToken(token: string, payload: TokenPayload): void;
export declare function getCachedToken(token: string): TokenPayload | null;
export declare function invalidateToken(token: string): void;
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireCoach(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireAthlete(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
