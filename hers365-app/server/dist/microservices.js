/**
 * MICROSERVICES ARCHITECTURE
 * Bounded contexts and service definitions for event-driven architecture
 */
import express from 'express';
import { eventPublisher, serviceBusClient } from './service-bus';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
// ─── BASE SERVICE CLASS ───────────────────────────────────────────────────────
export class Microservice {
    constructor(serviceName, port) {
        this.receivers = [];
        this.serviceName = serviceName;
        this.serviceId = uuidv4();
        this.port = port;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEventHandlers();
        this.setupHealthChecks();
    }
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        // Request correlation ID
        this.app.use((req, res, next) => {
            const correlationId = req.headers['x-correlation-id'] || uuidv4();
            req.correlationId = correlationId;
            res.setHeader('x-correlation-id', correlationId);
            next();
        });
        // Idempotency middleware
        this.app.use(async (req, res, next) => {
            const idempotencyKey = req.headers['idempotency-key'];
            if (idempotencyKey) {
                req.idempotencyKey = idempotencyKey;
            }
            next();
        });
    }
    setupHealthChecks() {
        this.app.get('/health', async (req, res) => {
            const health = await this.getHealthStatus();
            const statusCode = health.status === 'healthy' ? 200 :
                health.status === 'degraded' ? 200 : 503;
            res.status(statusCode).json(health);
        });
        this.app.get('/ready', async (req, res) => {
            const ready = await this.isReady();
            res.status(ready ? 200 : 503).json({ ready });
        });
    }
    async isReady() {
        // Check database connectivity, service bus, etc.
        return true;
    }
    async start() {
        try {
            // Initialize service bus infrastructure
            await serviceBusClient.ensureInfrastructure();
            // Start event subscriptions
            await this.startEventSubscriptions();
            // Start HTTP server
            this.app.listen(this.port, () => {
                logger.info(`${this.serviceName} service started on port ${this.port} (ID: ${this.serviceId})`);
            });
            // Register with service discovery
            await this.registerService();
        }
        catch (error) {
            logger.error(`Failed to start ${this.serviceName} service:`, error);
            throw error;
        }
    }
    async registerService() {
        // Service discovery registration would go here
        // For now, just log the service info
        logger.info(`Registered ${this.serviceName} service: ${this.serviceId}`);
    }
    async stop() {
        // Close event receivers
        for (const receiver of this.receivers) {
            await receiver.close();
        }
        logger.info(`${this.serviceName} service stopped`);
    }
    async publishEvent(event) {
        await eventPublisher.publish(event);
    }
    async handleEvent(message) {
        try {
            const event = message.body;
            // Add correlation context
            const correlationId = message.correlationId || uuidv4();
            logger.info(`Processing event: ${event.eventType} (${event.id}) [${correlationId}]`);
            await this.processEvent(event);
            logger.info(`Successfully processed event: ${event.eventType} (${event.id})`);
        }
        catch (error) {
            logger.error(`Error processing event ${message.messageId}:`, error);
            throw error;
        }
    }
}
// ─── AUTHENTICATION SERVICE ──────────────────────────────────────────────────
export class AuthenticationService extends Microservice {
    constructor(port = 3001) {
        super('auth-service', port);
    }
    setupRoutes() {
        // Authentication endpoints
        this.app.post('/login', this.handleLogin.bind(this));
        this.app.post('/refresh', this.handleRefresh.bind(this));
        this.app.post('/logout', this.handleLogout.bind(this));
        this.app.post('/mfa/setup', this.handleMFASetup.bind(this));
        this.app.post('/mfa/verify', this.handleMFAVerify.bind(this));
    }
    setupEventHandlers() {
        // Handle user-related events
        this.app.post('/events/user-created', this.handleUserCreatedEvent.bind(this));
        this.app.post('/events/user-updated', this.handleUserUpdatedEvent.bind(this));
    }
    async startEventSubscriptions() {
        // Subscribe to user events
        const userReceiver = await serviceBusClient.subscribeToTopic('user-events', `auth-service-${this.serviceId}`, this.handleEvent.bind(this));
        this.receivers.push(userReceiver);
        // Subscribe to auth-specific queue
        const authReceiver = await serviceBusClient.subscribeToQueue('auth-service-queue', this.handleAuthQueueMessage.bind(this));
        this.receivers.push(authReceiver);
    }
    async processEvent(event) {
        switch (event.eventType) {
            case 'UserCreated':
                await this.processUserCreated(event);
                break;
            case 'UserUpdated':
                await this.processUserUpdated(event);
                break;
            case 'UserDeleted':
                await this.processUserDeleted(event);
                break;
            default:
                logger.warn(`Unhandled event type: ${event.eventType}`);
        }
    }
    async handleLogin(req, res) {
        try {
            const { email, password, userType } = req.body;
            const correlationId = req.correlationId;
            // Publish login attempted event
            await eventPublisher.publishLoginAttempted({
                email,
                userType,
                ipAddress: req.ip || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
                correlationId,
                source: 'auth-service',
                deviceFingerprint: req.body.deviceFingerprint
            });
            // Authentication logic would go here
            // For now, simulate successful login
            const loginSuccessfulEvent = {
                id: uuidv4(),
                eventType: 'LoginSuccessful',
                aggregateId: email,
                aggregateType: 'Login',
                timestamp: new Date().toISOString(),
                correlationId,
                source: 'auth-service',
                version: 1,
                metadata: {
                    priority: 'high',
                    complianceFlags: ['gdpr']
                },
                payload: {
                    userId: 'user-123',
                    userType,
                    sessionId: uuidv4(),
                    mfaUsed: false,
                    ipAddress: req.ip || 'unknown',
                    deviceFingerprint: req.body.deviceFingerprint
                }
            };
            await this.publishEvent(loginSuccessfulEvent);
            res.json({
                success: true,
                sessionId: loginSuccessfulEvent.payload.sessionId,
                requiresMFA: false
            });
        }
        catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    }
    async handleRefresh(req, res) {
        // Token refresh logic
        res.json({ success: true, message: 'Token refreshed' });
    }
    async handleLogout(req, res) {
        // Logout logic
        res.json({ success: true, message: 'Logged out' });
    }
    async handleMFASetup(req, res) {
        // MFA setup logic
        res.json({ success: true, message: 'MFA setup initiated' });
    }
    async handleMFAVerify(req, res) {
        // MFA verification logic
        res.json({ success: true, message: 'MFA verified' });
    }
    async handleUserCreatedEvent(req, res) {
        // Handle user created event via HTTP webhook
        const event = req.body;
        await this.processUserCreated(event);
        res.json({ success: true });
    }
    async handleUserUpdatedEvent(req, res) {
        // Handle user updated event via HTTP webhook
        const event = req.body;
        await this.processUserUpdated(event);
        res.json({ success: true });
    }
    async handleAuthQueueMessage(message) {
        // Handle auth-specific messages from queue
        await this.handleEvent(message);
    }
    async processUserCreated(event) {
        // Update auth service state based on user creation
        logger.info(`Processing user created: ${event.payload.userId}`);
    }
    async processUserUpdated(event) {
        // Update auth service state based on user update
        logger.info(`Processing user updated: ${event.payload.userId}`);
    }
    async processUserDeleted(event) {
        // Handle user deletion - revoke sessions, tokens, etc.
        logger.info(`Processing user deleted: ${event.payload.userId}`);
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            checks: {
                database: { status: 'ok', responseTime: 10 },
                servicebus: { status: 'ok', responseTime: 5 }
            }
        };
    }
}
// ─── USER MANAGEMENT SERVICE ─────────────────────────────────────────────────
export class UserManagementService extends Microservice {
    constructor(port = 3002) {
        super('user-service', port);
    }
    setupRoutes() {
        this.app.post('/users', this.handleCreateUser.bind(this));
        this.app.put('/users/:id', this.handleUpdateUser.bind(this));
        this.app.delete('/users/:id', this.handleDeleteUser.bind(this));
        this.app.get('/users/:id', this.handleGetUser.bind(this));
    }
    setupEventHandlers() {
        // Handle auth-related events
        this.app.post('/events/login-successful', this.handleLoginSuccessful.bind(this));
    }
    async startEventSubscriptions() {
        // Subscribe to auth events
        const authReceiver = await serviceBusClient.subscribeToTopic('auth-events', `user-service-${this.serviceId}`, this.handleEvent.bind(this));
        this.receivers.push(authReceiver);
        // Subscribe to user-specific queue
        const userReceiver = await serviceBusClient.subscribeToQueue('user-service-queue', this.handleUserQueueMessage.bind(this));
        this.receivers.push(userReceiver);
    }
    async processEvent(event) {
        switch (event.eventType) {
            case 'LoginSuccessful':
                await this.processLoginSuccessful(event);
                break;
            default:
                logger.warn(`Unhandled event type: ${event.eventType}`);
        }
    }
    async handleCreateUser(req, res) {
        // Create user logic
        res.json({ success: true, message: 'User created' });
    }
    async handleUpdateUser(req, res) {
        // Update user logic
        res.json({ success: true, message: 'User updated' });
    }
    async handleDeleteUser(req, res) {
        // Delete user logic
        res.json({ success: true, message: 'User deleted' });
    }
    async handleGetUser(req, res) {
        // Get user logic
        res.json({ success: true, user: { id: req.params.id } });
    }
    async handleLoginSuccessful(req, res) {
        const event = req.body;
        await this.processLoginSuccessful(event);
        res.json({ success: true });
    }
    async handleUserQueueMessage(message) {
        await this.handleEvent(message);
    }
    async processLoginSuccessful(event) {
        // Update last login timestamp, etc.
        logger.info(`Processing login successful: ${event.payload.userId}`);
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            checks: {
                database: { status: 'ok', responseTime: 8 },
                servicebus: { status: 'ok', responseTime: 3 }
            }
        };
    }
}
// ─── SERVICE ORCHESTRATOR ────────────────────────────────────────────────────
export class ServiceOrchestrator {
    constructor() {
        this.services = [];
        this.serviceDiscovery = new Map();
    }
    async startServices() {
        logger.info('Starting microservices...');
        // Initialize services
        const authService = new AuthenticationService(3001);
        const userService = new UserManagementService(3002);
        this.services = [authService, userService];
        this.serviceDiscovery.set('auth-service', authService);
        this.serviceDiscovery.set('user-service', userService);
        // Start all services
        await Promise.all(this.services.map(service => service.start()));
        logger.info('All microservices started successfully');
    }
    async stopServices() {
        logger.info('Stopping microservices...');
        await Promise.all(this.services.map(service => service.stop()));
        logger.info('All microservices stopped');
    }
    getService(serviceName) {
        return this.serviceDiscovery.get(serviceName);
    }
    getAllServices() {
        return this.services;
    }
}
export const serviceOrchestrator = new ServiceOrchestrator();
//# sourceMappingURL=microservices.js.map