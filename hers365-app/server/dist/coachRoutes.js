// @ts-nocheck
/**
 * Coach Scouting Portal — API Routes
 * All routes require coach role JWT token
 */
import express from 'express';
import { requireCoach } from './auth';
const router = express.Router();
// Apply coach middleware to ALL coach routes
router.use(requireCoach);
// ─── Mock scouting boards (in-memory for MVP) ─────────────────────────────────
const coachBoards = {};
const coachMessages = [];
// ─── Player Search (the main discovery tool) ──────────────────────────────────
/**
 * GET /coach/players/search
 * Filter by position, state, gradYear, minHeight, minBreakout, etc.
 * This is the core recruiting tool.
 */
router.get('/players/search', async (req, res) => {
    const { q, position, state, gradYear, minBreakoutScore, limit = '25', offset = '0' } = req.query;
    // Mock rich dataset of player profiles
    const mockPlayers = [
        {
            id: 1, name: 'Aaliyah Thompson', position: 'WR', state: 'TX', city: 'Dallas',
            school: 'Westlake High', gradYear: 2026, height: '5\'8"', weight: 135,
            gpa: 3.8, breakoutScore: 98, stars: 5, archetype: 'Speedster',
            stats: { receptions: 64, receivingYards: 1204, receivingTouchdowns: 18, gamesPlayed: 12 },
            combineStats: { fortyYard: '4.52', vertical: 36, broadJump: 118 },
            highlights: 2, verified: true, offers: 4, committed: false,
            nilPoints: 4200, avatarUrl: null,
        },
        {
            id: 2, name: 'Jordan Davis', position: 'QB', state: 'FL', city: 'Miami',
            school: 'Miami Southridge', gradYear: 2026, height: '5\'10"', weight: 145,
            gpa: 3.5, breakoutScore: 95, stars: 5, archetype: 'Dual-Threat',
            stats: { passingYards: 2840, passingTouchdowns: 32, passingInterceptions: 4, passingAttempts: 220, passingCompletions: 162, gamesPlayed: 12 },
            combineStats: { fortyYard: '4.65', vertical: 31, broadJump: 110 },
            highlights: 5, verified: true, offers: 7, committed: false,
            nilPoints: 3100, avatarUrl: null,
        },
        {
            id: 3, name: 'Maya Rodriguez', position: 'CB', state: 'CA', city: 'Los Angeles',
            school: 'Crenshaw High', gradYear: 2027, height: '5\'7"', weight: 128,
            gpa: 4.0, breakoutScore: 89, stars: 4, archetype: 'Lockdown',
            stats: { flagPulls: 48, interceptions: 8, gamesPlayed: 11 },
            combineStats: { fortyYard: '4.58', vertical: 34, broadJump: 115 },
            highlights: 3, verified: false, offers: 2, committed: false,
            nilPoints: 1800, avatarUrl: null,
        },
        {
            id: 4, name: 'Destiny Williams', position: 'RB', state: 'GA', city: 'Atlanta',
            school: 'Westlake HS (GA)', gradYear: 2026, height: '5\'5"', weight: 130,
            gpa: 3.2, breakoutScore: 84, stars: 4, archetype: 'Power Back',
            stats: { rushingYards: 934, rushingTouchdowns: 12, rushingAttempts: 98, gamesPlayed: 11 },
            combineStats: { fortyYard: '4.71', vertical: 29, broadJump: 105 },
            highlights: 1, verified: true, offers: 1, committed: false,
            nilPoints: 900, avatarUrl: null,
        },
    ];
    let results = [...mockPlayers];
    // Filter
    if (q)
        results = results.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.school.toLowerCase().includes(q.toLowerCase()));
    if (position)
        results = results.filter(p => p.position === position);
    if (state)
        results = results.filter(p => p.state === state);
    if (gradYear)
        results = results.filter(p => p.gradYear === parseInt(gradYear));
    if (minBreakoutScore)
        results = results.filter(p => p.breakoutScore >= parseInt(minBreakoutScore));
    // Sort by breakout score
    results.sort((a, b) => b.breakoutScore - a.breakoutScore);
    const paginated = results.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    res.json({
        total: results.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        players: paginated,
    });
});
/**
 * GET /coach/players/:id — Full unlocked athlete profile (coaches see everything)
 */
router.get('/players/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const mockFull = {
        id,
        name: 'Aaliyah Thompson',
        position: 'WR',
        state: 'TX',
        city: 'Dallas',
        school: 'Westlake High',
        gradYear: 2026,
        height: '5\'8"',
        weight: 135,
        gpa: 3.8,
        breakoutScore: 98,
        stars: 5,
        archetype: 'WR Speedster',
        email: 'available@premium',
        phone: 'available@premium',
        parentContact: 'available@premium',
        highlights: [
            { title: 'Junior Season Full Game', url: 'https://youtube.com/...', locked: false },
            { title: 'State Championship Highlights', url: 'https://youtube.com/...', locked: false },
        ],
        stats: { receptions: 64, receivingYards: 1204, receivingTouchdowns: 18, ydsPerCatch: 18.8, gamesPlayed: 12 },
        combineStats: { fortyYard: '4.52', vertical: 36, broadJump: 118, shuttle: '4.15', verified: true },
        academicProfile: { gpa: 3.8, act: 27, sat: 1280, major: 'Sports Medicine' },
        offers: ['TCU', 'Baylor', 'UTSA', 'Rice'],
        committed: false,
        nilPoints: 4200,
    };
    res.json(mockFull);
});
// ─── Scouting Board ───────────────────────────────────────────────────────────
/**
 * GET /coach/board — Get coach's scouting board
 */
router.get('/board', (req, res) => {
    const coachId = req.user.userId;
    res.json({ board: coachBoards[coachId] || [] });
});
/**
 * POST /coach/players/:id/save — Add player to scouting board
 */
router.post('/players/:id/save', (req, res) => {
    const coachId = req.user.userId;
    const playerId = parseInt(req.params.id);
    const { tier = 'watching' } = req.body; // tiers: 'top-target' | 'watching' | 'offered'
    if (!coachBoards[coachId])
        coachBoards[coachId] = [];
    const existing = coachBoards[coachId].find((p) => p.playerId === playerId);
    if (!existing) {
        coachBoards[coachId].push({ playerId, tier, savedAt: new Date().toISOString() });
    }
    res.json({ success: true, board: coachBoards[coachId] });
});
/**
 * DELETE /coach/players/:id/save — Remove from scouting board
 */
router.delete('/players/:id/save', (req, res) => {
    const coachId = req.user.userId;
    const playerId = parseInt(req.params.id);
    if (coachBoards[coachId]) {
        coachBoards[coachId] = coachBoards[coachId].filter((p) => p.playerId !== playerId);
    }
    res.json({ success: true });
});
// ─── Messaging ────────────────────────────────────────────────────────────────
/**
 * POST /coach/message/:playerId — Send a message to an athlete
 */
router.post('/message/:playerId', (req, res) => {
    const { message } = req.body;
    const { name: coachName, email: coachEmail } = req.user;
    const playerId = parseInt(req.params.playerId);
    const msg = { id: Date.now(), coachName, coachEmail, playerId, message, sentAt: new Date().toISOString() };
    coachMessages.push(msg);
    // In production: save to DB + send push notification to athlete
    res.json({ success: true, message: msg });
});
// ─── Coach Analytics ──────────────────────────────────────────────────────────
/**
  * GET /coach/analytics — Recently viewed players, board stats
  */
router.get('/analytics', (req, res) => {
    const coachId = req.user.userId;
    res.json({
        boardCount: (coachBoards[coachId] || []).length,
        messagesSent: coachMessages.filter(m => m.coachEmail === req.user.email).length,
        profileViews: 47, // mock
        topStates: ['TX', 'FL', 'CA', 'GA'],
        recentlyViewed: [1, 2, 3],
    });
});
/**
  * GET /coach/player-clips — Get player highlight clips
  */
router.get('/player-clips', (req, res) => {
    const clips = [
        {
            id: 1,
            playerId: 1,
            name: 'Aaliyah Thompson',
            position: 'WR',
            school: 'Westlake High',
            state: 'TX',
            gradYear: 2026,
            stars: 5,
            breakoutScore: 98,
            clipUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
            title: 'One-handed catch in double coverage 🤯 #StateChamps',
            views: 1245,
            likes: 234,
            shares: 45,
            measurements: {
                height: '5\'8"',
                weight: '135 lbs',
                fortyYard: '4.52',
                vertical: '36"',
                broadJump: '118"'
            },
            stats: {
                receptions: 64,
                receivingYards: 1204,
                receivingTouchdowns: 18
            },
            verified: true,
            createdAt: '2024-05-15T14:30:00Z'
        },
        {
            id: 2,
            playerId: 2,
            name: 'Jordan Davis',
            position: 'QB',
            school: 'Miami Southridge',
            state: 'FL',
            gradYear: 2026,
            stars: 5,
            breakoutScore: 95,
            clipUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop',
            title: 'Testing the deep ball at Elite11 regional camp 🚀',
            views: 987,
            likes: 189,
            shares: 32,
            measurements: {
                height: '5\'10"',
                weight: '145 lbs',
                fortyYard: '4.65',
                vertical: '31"',
                broadJump: '110"'
            },
            stats: {
                passingYards: 2840,
                passingTouchdowns: 32,
                passingInterceptions: 4
            },
            verified: true,
            createdAt: '2024-05-14T16:45:00Z'
        },
        {
            id: 3,
            playerId: 3,
            name: 'Maya Rodriguez',
            position: 'CB',
            school: 'Crenshaw High',
            state: 'CA',
            gradYear: 2027,
            stars: 4,
            breakoutScore: 89,
            clipUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=600&auto=format&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=600&auto=format&fit=crop',
            title: 'Lockdown coverage at the 7on7 tournament 🔒',
            views: 756,
            likes: 145,
            shares: 28,
            measurements: {
                height: '5\'7"',
                weight: '128 lbs',
                fortyYard: '4.58',
                vertical: '34"',
                broadJump: '115"'
            },
            stats: {
                flagPulls: 48,
                interceptions: 8
            },
            verified: false,
            createdAt: '2024-05-13T18:20:00Z'
        },
        {
            id: 4,
            playerId: 4,
            name: 'Destiny Williams',
            position: 'RB',
            school: 'Westlake HS (GA)',
            state: 'GA',
            gradYear: 2026,
            stars: 4,
            breakoutScore: 84,
            clipUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
            thumbnailUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
            title: '40-yard reverse for the game-winner! 🏃‍♀️💨',
            views: 1567,
            likes: 289,
            shares: 67,
            measurements: {
                height: '5\'5"',
                weight: '130 lbs',
                fortyYard: '4.71',
                vertical: '29"',
                broadJump: '105"'
            },
            stats: {
                rushingYards: 934,
                rushingTouchdowns: 12,
                rushingAttempts: 98
            },
            verified: true,
            createdAt: '2024-05-12T19:15:00Z'
        }
    ];
    res.json({ clips });
});
export default router;
//# sourceMappingURL=coachRoutes.js.map