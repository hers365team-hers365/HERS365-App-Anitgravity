// @ts-nocheck
/**
  */
import express from 'express';
import * as auth from './auth';
import * as schema from './schema';
import rateLimit from 'express-rate-limit';

  windowMs: 60 * 1000, // 1 minute window
  max: 50, // 50 login attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count failed attempts the same as successful ones
  skipSuccessfulRequests: false,

  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // 10 attempts after first 5 failures
  skipSuccessfulRequests: true,


];
];
];


  // First check mock users

  // Then check database players table

  // First check mock users

  // Then check database parents table
      phone: dbUsers[0].phone,

  // First check mock users

  // Then check database coaches table
      email: dbUsers[0].email || '',
      school: dbUsers[0].university,
      division: dbUsers[0].division,

// ─── Athlete Auth ─────────────────────────────────────────────────────────────

/**
 * POST /auth/athlete/register
 */
    // Mock user creation (use DB in production):
    mockAthletes.push(newUser);

/**
  * POST /auth/athlete/login
  */




// ─── Parent Auth ─────────────────────────────────────────────────────────────

/**
 * POST /auth/parent/register
 */


    // Mock user creation (use DB in production):
      name,
      phone: phone || null,
    mockParents.push(newParent);

/**
  * POST /auth/parent/login
  */




// ─── Coach Auth ───────────────────────────────────────────────────────────────

/**
 * POST /auth/coach/register
 */
    mockCoaches.push(newCoach);

/**
  * POST /auth/coach/login
  */




/**
 */

// ─── Admin Auth ───────────────────────────────────────────────────────────────

/**
  */



/**
  */





export default router;
