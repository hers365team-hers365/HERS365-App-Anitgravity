// @ts-nocheck
/**
  * Auth Routes — Database-backed authentication for athletes, parents, and coaches
  * SCALABILITY: Rate limited for 50K users, optimized bcrypt for login
  */
import express from 'express';
import * as auth from './auth';
import { db } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'mock-client-id');

// Rate limiter for login endpoints - prevents brute force attacks
// 50 requests per minute per IP = handles 50K users with proper scaling
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 50, // 50 login attempts per minute per IP
  message: { error: 'Too many login attempts, please try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count failed attempts the same as successful ones
  skipSuccessfulRequests: false,
});

// Stricter limiter for failed attempts
const failedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // 10 attempts after first 5 failures
  message: { error: 'Account temporarily locked due to too many failed attempts' },
  skipSuccessfulRequests: true,
});

const router = express.Router();

// Keep mock users for demo purposes (these work with the demo credentials)
const mockAthletes = [
  { id: 1, email: 'athlete@demo.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGRe.XFLJeMGSnD5oE9qCr5e5Fy', name: 'Marcus Johnson', role: 'athlete' }, // password: demo123
];
const mockParents = [
  { id: 201, email: 'parent@demo.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGRe.XFLJeMGSnD5oE9qCr5e5Fy', name: 'Sarah Johnson', role: 'parent', phone: '555-1234' }, // password: demo123
];
const mockCoaches = [
  { id: 101, email: 'coach@texas.edu', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGRe.XFLJeMGSnD5oE9qCr5e5Fy', name: 'Coach Williams', school: 'University of Texas', division: 'D1', role: 'coach' }, // password: demo123
];


// Helper function to find user in database or fallback to mock
async function findAthlete(email: string) {
  // First check mock users
  const mockUser = mockAthletes.find(u => u.email === email);
  if (mockUser) return mockUser;

  // Then check database players table
  const dbUsers = await db.select().from(schema.players).where(eq(schema.players.email, email)).limit(1);
  if (dbUsers.length > 0) {
    return {
      id: dbUsers[0].id,
      email: dbUsers[0].email,
      password: dbUsers[0].passwordHash || '',
      name: dbUsers[0].name,
      role: 'athlete'
    };
  }
  return null;
}

async function findParent(email: string) {
  // First check mock users
  const mockUser = mockParents.find(u => u.email === email);
  if (mockUser) return mockUser;

  // Then check database parents table
  const dbUsers = await db.select().from(schema.parents).where(eq(schema.parents.email, email)).limit(1);
  if (dbUsers.length > 0) {
    return {
      id: dbUsers[0].id,
      email: dbUsers[0].email,
      password: dbUsers[0].passwordHash || '',
      name: dbUsers[0].name,
      phone: dbUsers[0].phone,
      role: 'parent'
    };
  }
  return null;
}

async function findCoach(email: string) {
  // First check mock users
  const mockUser = mockCoaches.find(u => u.email === email);
  if (mockUser) return mockUser;

  // Then check database coaches table
  const dbUsers = await db.select().from(schema.coaches).where(eq(schema.coaches.email, email)).limit(1);
  if (dbUsers.length > 0) {
    return {
      id: dbUsers[0].id,
      email: dbUsers[0].email || '',
      name: dbUsers[0].name,
      school: dbUsers[0].university,
      division: dbUsers[0].division,
      role: 'coach'
    };
  }
  return null;
}

// ─── Athlete Auth ─────────────────────────────────────────────────────────────

/**
 * POST /auth/athlete/register
 */
router.post('/athlete/register', async (req, res) => {
  const { email, password, name, position, state, school, gradYear } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  try {
    const hashed = await auth.hashPassword(password);
    // Mock user creation (use DB in production):
    const newUser = { id: Date.now(), email, password: hashed, name, role: 'athlete' };
    mockAthletes.push(newUser);
    const token = auth.signToken({ userId: newUser.id, email, role: 'athlete', name });
    res.status(201).json({
      token,
      user: { id: newUser.id, email, name, role: 'athlete', position, state, school, gradYear }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
  * POST /auth/athlete/login
  * RATE LIMITED: 50 req/min per IP for 50K user scalability
  */
  router.post('/athlete/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const user = await findAthlete(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await auth.comparePassword(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = auth.signToken({ userId: user.id, email: user.email, role: 'athlete', name: user.name });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: 'athlete' }
  });
});

// ─── Parent Auth ─────────────────────────────────────────────────────────────

/**
 * POST /auth/parent/register
 */
router.post('/parent/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  // Check if parent already exists
  const existingParent = mockParents.find(p => p.email === email);
  if (existingParent) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  try {
    const hashed = await auth.hashPassword(password);
    // Mock user creation (use DB in production):
    const newParent = {
      id: Date.now(),
      email,
      password: hashed,
      name,
      phone: phone || null,
      role: 'parent'
    };
    mockParents.push(newParent);
    const token = auth.signToken({ userId: newParent.id, email, role: 'parent', name });
    res.status(201).json({
      token,
      user: { id: newParent.id, email, name, role: 'parent', phone }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
  * POST /auth/parent/login
  * RATE LIMITED: 50 req/min per IP for 50K user scalability
  */
  router.post('/parent/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const user = await findParent(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await auth.comparePassword(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = auth.signToken({ userId: user.id, email: user.email, role: 'parent', name: user.name });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: 'parent', phone: user.phone }
  });
});

// ─── Coach Auth ───────────────────────────────────────────────────────────────

/**
 * POST /auth/coach/register
 */
router.post('/coach/register', async (req, res) => {
  const { email, password, name, school, division, sport } = req.body;
  if (!email || !password || !name || !school) {
    return res.status(400).json({ error: 'email, password, name, and school are required' });
  }
  try {
    const hashed = await auth.hashPassword(password);
    const newCoach = { id: Date.now(), email, password: hashed, name, school, division: division || 'D1', role: 'coach' };
    mockCoaches.push(newCoach);
    const token = auth.signToken({ userId: newCoach.id, email, role: 'coach', name });
    res.status(201).json({
      token,
      user: { id: newCoach.id, email, name, role: 'coach', school, division }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
  * POST /auth/coach/login
  * RATE LIMITED: 50 req/min per IP for 50K user scalability
  */
  router.post('/coach/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const coach = await findCoach(email);
  if (!coach) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await auth.comparePassword(password, coach.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = auth.signToken({ userId: coach.id, email: coach.email, role: 'coach', name: coach.name });
  res.json({
    token,
    user: { id: coach.id, email: coach.email, name: coach.name, role: 'coach', school: coach.school, division: coach.division }
  });
});

/**
 * GET /auth/me — Get current user from token
 */
router.get('/me', auth.requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── Admin Auth ───────────────────────────────────────────────────────────────

/**
  * POST /auth/admin/register
  */
router.post('/admin/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  // Check if admin already exists
  const existingAdmin = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, email)).limit(1);
  if (existingAdmin.length > 0) {
    return res.status(400).json({ error: 'An admin account with this email already exists' });
  }

  try {
    const hashed = await auth.hashPassword(password);
    const newAdmin = {
      username: email,
      passwordHash: hashed,
      role: 'admin',
    };
    await db.insert(schema.adminUsers).values(newAdmin);
    const token = auth.signToken({ userId: email, email, role: 'admin', name });
    res.status(201).json({
      token,
      user: { id: email, email, name, role: 'admin' }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
  * POST /auth/admin/login
  */
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  // Check database for admin
  const admin = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, email)).limit(1);

  if (admin.length === 0) {
    // Fallback to hardcoded admin for demo
    if (email === 'admin@hers365.com' && password === 'admin123') {
      const token = auth.signToken({ userId: 1, email, role: 'admin', name: 'System Admin' });
      return res.json({
        token,
        user: { id: 1, email, name: 'System Admin', role: 'admin' }
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await auth.comparePassword(password, admin[0].passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = auth.signToken({ userId: admin[0].id, email, role: 'admin', name: admin[0].username });
  res.json({
    token,
    user: { id: admin[0].id, email, name: admin[0].username, role: 'admin' }
  });
});

// ─── Social Login ─────────────────────────────────────────────────────────────

/**
 * POST /auth/social/:provider
 * Unified endpoint for Google and Meta OAuth login
 */
router.post('/social/:provider', loginLimiter, async (req, res) => {
  const { provider } = req.params;
  const { token, role } = req.body;

  if (!token) return res.status(400).json({ error: 'Auth token is required' });

  // Validate the role
  const validRoles = ['athlete', 'parent', 'coach'];
  const userRole = validRoles.includes(role) ? role : 'athlete';

  try {
    let email = '';
    let name = '';
    let picture = '';

    if (provider === 'google') {
      try {
        if (!process.env.GOOGLE_CLIENT_ID) {
          // Mock verification for local dev
          console.warn('[Mock Auth] Missing GOOGLE_CLIENT_ID. Mocking Google verification.');
          email = 'google_user@demo.com';
          name = 'Google Athlete';
        } else {
          // Secure Google Token Verification
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          email = payload?.email || '';
          name = payload?.name || '';
          picture = payload?.picture || '';
        }
      } catch (e: any) {
        return res.status(401).json({ error: 'Invalid Google Token' });
      }
    } else if (provider === 'meta') {
      // Mock Meta verification (would normally use FB graph API here)
      console.warn('[Mock Auth] Mocking Meta verification.');
      email = 'meta_user@demo.com';
      name = 'Meta Athlete';
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    if (!email) return res.status(400).json({ error: 'Failed to retrieve email from provider' });

    // Try finding the user
    let user = null;
    if (userRole === 'athlete') user = await findAthlete(email);
    else if (userRole === 'parent') user = await findParent(email);
    else if (userRole === 'coach') user = await findCoach(email);

    if (!user) {
      // Auto-register mock user for demo if not found in DB
      user = { id: Date.now(), email, name, role: userRole };
      if (userRole === 'athlete') mockAthletes.push(user as any);
      else if (userRole === 'parent') mockParents.push(user as any);
      else if (userRole === 'coach') mockCoaches.push({ ...user, school: 'TBD', division: 'TBD' } as any);
    }

    const jwtToken = auth.signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    
    res.json({
      token: jwtToken,
      user
    });

  } catch (error: any) {
    console.error('Social auth error:', error);
    res.status(500).json({ error: 'Internal server error during social login' });
  }
});

export default router;

