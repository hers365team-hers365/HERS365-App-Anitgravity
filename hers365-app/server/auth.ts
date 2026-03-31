import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from './logger';

/**
  * Auth Service — JWT-based auth with roles: 'athlete' | 'coach' | 'admin'
  */
const JWT_SECRET = process.env.JWT_SECRET || 'hers365-super-secret-jwt-key-change-in-prod';
const JWT_EXPIRES = '7d';

export type UserRole = 'athlete' | 'coach' | 'admin';

export type TokenPayload = {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
};

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// ─── Token ────────────────────────────────────────────────────────────────────
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// ─── Password ─────────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 14); // Increased rounds for better security
}


export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hashed);
  } catch (error) {
    logger.error('Password compare failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

// ─── Token Cache for 50K User Scalability ──────────────────────────────────────
const tokenCache = new Map<string, { payload: TokenPayload, expires: number }>();
const TOKEN_CACHE_TTL = 5 * 60 * 1000; 
const MAX_CACHE_SIZE = 10000;

export function cacheToken(token: string, payload: TokenPayload): void {
  const now = Date.now();
  if (tokenCache.size >= MAX_CACHE_SIZE) {
    for (const [key, value] of tokenCache.entries()) {
      if (value.expires < now) tokenCache.delete(key);
    }
    if (tokenCache.size >= MAX_CACHE_SIZE * 0.9) {
      const entries = Array.from(tokenCache.entries());
      entries.slice(0, Math.floor(entries.length / 2)).forEach(([k]) => tokenCache.delete(k));
    }
  }
  tokenCache.set(token, { payload, expires: now + TOKEN_CACHE_TTL });
}

export function getCachedToken(token: string): TokenPayload | null {
  const cached = tokenCache.get(token);
  const now = Date.now();
  if (cached && cached.expires > now) {
    return cached.payload;
  }
  if (cached) tokenCache.delete(token);
  return null;
}

export function invalidateToken(token: string): void {
  tokenCache.delete(token);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (value.expires < now) tokenCache.delete(key);
  }
}, 60000);

// ─── Express Middleware ───────────────────────────────────────────────────────
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = auth.slice(7);

  let payload = getCachedToken(token);

  if (!payload) {
    payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    cacheToken(token, payload);
  }

  req.user = payload;
  next();
};

export function requireCoach(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'coach' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Coach access required' });
    }
    next();
  });
}

export function requireAthlete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'athlete' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Athlete access required' });
    }
    next();
  });
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
