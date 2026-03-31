// @ts-nocheck
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10kb' })); // Limit body size
// Response wrapper utility
app.use((req, res, next) => {
    res.success = (data, message = 'Success') => {
        res.json({ success: true, message, data });
    };
    next();
});
// Health check with dependency status for 50K user scalability
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };
    try {
        const { db } = await import('./db');
        db.exec('SELECT 1');
        health.database = { status: 'connected' };
    }
    catch (error) {
        health.database = { status: 'error', message: error.message };
    }
    res.status(health.database?.status === 'connected' ? 200 : 503).json(health);
});
// ... Existing routes ...
import apiRoutes from './routes';
import authRoutes from './authRoutes';
import coachRoutes from './coachRoutes';
import paymentRoutes from './paymentRoutes';
import exportRoutes from './exportRoutes';
import adminRoutes from './adminRoutes';
import tokenRoutes from './tokenRoutes';
import scholarshipRoutes from './scholarshipRoutes';
import rankingRoutes from './rankingRoutes';
import eventRoutes from './eventRoutes';
import supportRoutes from './supportRoutes';
import agentOrchestrator from './agents/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/coach', coachRoutes);
app.use('/payments', paymentRoutes);
app.use('/export', exportRoutes);
app.use('/admin', adminRoutes);
app.use('/tokens', tokenRoutes);
app.use('/scholarships', scholarshipRoutes);
app.use('/rankings', rankingRoutes);
app.use('/events', eventRoutes);
app.use('/support', supportRoutes);
// Static files and SPA fallback
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/coach') || req.path.startsWith('/support')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
        if (err) {
            // If index.html doesn't exist, just send 404
            res.status(404).send('Client not built or index.html missing');
        }
    });
});
app.listen(port, () => {
    console.log(`\n🏈 H.E.R.S.365 Server ready on port ${port}`);
    console.log(`   Athlete API: http://localhost:${port}/api/`);
    console.log(`   Coach API:   http://localhost:${port}/coach/`);
    console.log(`   Auth:        http://localhost:${port}/auth/\n`);
});
// Start AI Agents for monitoring
if (process.env.ENABLE_AI_AGENTS === "true" || process.env.NODE_ENV !== "production") {
    console.log("🤖 Starting AI Agents for monitoring and bug detection...");
    agentOrchestrator.startAll({ codePath: "./server" });
}
//# sourceMappingURL=index.js.map