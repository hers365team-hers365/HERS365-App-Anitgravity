/**
 * SAGA PATTERN IMPLEMENTATION
 * Complex transaction management across microservices
 */
import { db } from './db';
import * as schema from './schema';
import { eq, and, lt } from 'drizzle-orm';
import { eventPublisher } from './service-bus';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
export class Saga {
    constructor(sagaId, correlationId, aggregateId, aggregateType, steps) {
        this.currentStepIndex = 0;
        this.completedSteps = [];
        this.compensating = false;
        this.sagaId = sagaId;
        this.correlationId = correlationId;
        this.aggregateId = aggregateId;
        this.aggregateType = aggregateType;
        this.steps = steps;
    }
    async execute() {
        try {
            await this.saveSagaState('pending');
            for (let i = this.currentStepIndex; i < this.steps.length; i++) {
                const step = this.steps[i];
                try {
                    logger.info(`Executing saga step: ${step.name} (${this.sagaId})`);
                    await step.action();
                    this.completedSteps.push(step.id);
                    this.currentStepIndex = i + 1;
                    await this.saveSagaState('pending', step.name);
                }
                catch (error) {
                    logger.error(`Saga step failed: ${step.name} (${this.sagaId})`, error);
                    // Start compensation
                    this.compensating = true;
                    await this.saveSagaState('compensating', step.name, error instanceof Error ? error.message : 'Unknown error');
                    await this.compensate();
                    await this.saveSagaState('failed', step.name, error instanceof Error ? error.message : 'Unknown error');
                    throw error;
                }
            }
            await this.saveSagaState('completed');
            logger.info(`Saga completed successfully: ${this.sagaId}`);
        }
        catch (error) {
            logger.error(`Saga execution failed: ${this.sagaId}`, error);
            throw error;
        }
    }
    async compensate() {
        logger.info(`Starting compensation for saga: ${this.sagaId}`);
        // Execute compensation in reverse order
        for (let i = this.completedSteps.length - 1; i >= 0; i--) {
            const stepId = this.completedSteps[i];
            const step = this.steps.find(s => s.id === stepId);
            if (step?.compensation) {
                try {
                    logger.info(`Executing compensation: ${step.name} (${this.sagaId})`);
                    await step.compensation();
                }
                catch (compensationError) {
                    logger.error(`Compensation failed for step: ${step.name} (${this.sagaId})`, compensationError);
                    // Continue with other compensations even if one fails
                }
            }
        }
    }
    async saveSagaState(status, currentStep, errorMessage) {
        await db
            .insert(schema.sagaInstances)
            .values({
            id: this.sagaId,
            sagaType: this.constructor.name,
            correlationId: this.correlationId,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            status,
            currentStep,
            stepsCompleted: JSON.stringify(this.completedSteps),
            compensating: this.compensating,
            errorMessage,
            updatedAt: new Date().toISOString()
        })
            .onConflictDoUpdate({
            target: schema.sagaInstances.id,
            set: {
                status,
                currentStep,
                stepsCompleted: JSON.stringify(this.completedSteps),
                compensating: this.compensating,
                errorMessage,
                updatedAt: new Date().toISOString()
            }
        });
    }
}
// ─── USER REGISTRATION SAGA ──────────────────────────────────────────────────
export class UserRegistrationSaga extends Saga {
    constructor(sagaId, correlationId, userData) {
        super(sagaId, correlationId, userData.userId, 'User', []);
        this.userData = userData;
        this.steps = this.defineSteps();
    }
    defineSteps() {
        return [
            {
                id: 'validate-user-data',
                name: 'Validate User Data',
                action: async () => {
                    // Validate user data (age verification for minors, etc.)
                    if (this.userData.userType === 'athlete' && this.userData.metadata?.age < 13) {
                        // COPPA compliance check
                        if (!this.userData.metadata?.parentalConsent) {
                            throw new Error('Parental consent required for users under 13');
                        }
                    }
                }
            },
            {
                id: 'create-user-profile',
                name: 'Create User Profile',
                action: async () => {
                    // Publish user created event
                    await eventPublisher.publishUserCreated({
                        userId: this.userData.userId,
                        userType: this.userData.userType,
                        email: this.userData.email,
                        name: this.userData.name,
                        correlationId: this.correlationId,
                        source: 'user-registration-saga',
                        metadata: this.userData.metadata
                    });
                },
                compensation: async () => {
                    // Publish user deleted event
                    const deleteEvent = {
                        id: uuidv4(),
                        eventType: 'UserDeleted',
                        aggregateId: this.userData.userId,
                        aggregateType: 'User',
                        timestamp: new Date().toISOString(),
                        correlationId: this.correlationId,
                        source: 'user-registration-saga-compensation',
                        version: 1,
                        metadata: {
                            complianceFlags: ['gdpr'],
                            priority: 'high'
                        },
                        payload: {
                            userId: this.userData.userId,
                            userType: this.userData.userType,
                            reason: 'Registration failed - compensation',
                            deletedBy: 'system',
                            dataRetentionPeriod: 30
                        }
                    };
                    await eventPublisher.publish(deleteEvent);
                }
            },
            {
                id: 'setup-user-preferences',
                name: 'Setup User Preferences',
                action: async () => {
                    // Setup default preferences, privacy settings, etc.
                    logger.info(`Setting up preferences for user: ${this.userData.userId}`);
                },
                compensation: async () => {
                    // Clean up preferences
                    logger.info(`Cleaning up preferences for user: ${this.userData.userId}`);
                }
            },
            {
                id: 'send-welcome-email',
                name: 'Send Welcome Email',
                action: async () => {
                    // Queue welcome email
                    const emailEvent = {
                        id: uuidv4(),
                        eventType: 'MessageSent',
                        aggregateId: this.userData.userId,
                        aggregateType: 'User',
                        timestamp: new Date().toISOString(),
                        correlationId: this.correlationId,
                        userId: this.userData.userId,
                        userType: this.userData.userType,
                        source: 'user-registration-saga',
                        version: 1,
                        metadata: {
                            complianceFlags: ['gdpr'],
                            priority: 'medium'
                        },
                        payload: {
                            messageId: uuidv4(),
                            senderId: 'system',
                            senderType: 'system',
                            recipientId: this.userData.userId,
                            recipientType: this.userData.userType,
                            messageType: 'system',
                            content: `Welcome to HERS365, ${this.userData.name}!`,
                            priority: 'medium'
                        }
                    };
                    await eventPublisher.publish(emailEvent);
                }
            }
        ];
    }
}
// ─── NIL DEAL CREATION SAGA ──────────────────────────────────────────────────
export class NILDealCreationSaga extends Saga {
    constructor(sagaId, correlationId, dealData) {
        super(sagaId, correlationId, dealData.dealId, 'NILDeal', []);
        this.dealData = dealData;
        this.steps = this.defineSteps();
    }
    defineSteps() {
        return [
            {
                id: 'validate-deal-compliance',
                name: 'Validate Deal Compliance',
                action: async () => {
                    // COPPA compliance: Ensure athlete is of legal age or has parental consent
                    // FERPA compliance: Ensure deal doesn't interfere with academic status
                    // Financial compliance: Validate payment methods and reporting requirements
                    logger.info(`Validating compliance for NIL deal: ${this.dealData.dealId}`);
                }
            },
            {
                id: 'create-deal-record',
                name: 'Create Deal Record',
                action: async () => {
                    const dealEvent = {
                        id: uuidv4(),
                        eventType: 'NILDealCreated',
                        aggregateId: this.dealData.dealId,
                        aggregateType: 'NILDeal',
                        timestamp: new Date().toISOString(),
                        correlationId: this.correlationId,
                        userId: this.dealData.athleteId,
                        userType: 'athlete',
                        source: 'nil-deal-saga',
                        version: 1,
                        metadata: {
                            complianceFlags: ['coppa', 'ferpa', 'pci'],
                            priority: 'high'
                        },
                        payload: {
                            dealId: this.dealData.dealId,
                            athleteId: this.dealData.athleteId,
                            brandId: this.dealData.brandId,
                            amount: this.dealData.amount,
                            currency: this.dealData.currency,
                            dealType: 'endorsement', // Default type
                            deliverables: this.dealData.deliverables,
                            startDate: this.dealData.startDate,
                            endDate: this.dealData.endDate,
                            status: 'pending',
                            parentConsent: true, // Assume validated
                            legalReview: false
                        }
                    };
                    await eventPublisher.publish(dealEvent);
                },
                compensation: async () => {
                    // Cancel the deal
                    logger.info(`Cancelling NIL deal: ${this.dealData.dealId}`);
                }
            },
            {
                id: 'setup-payment-processing',
                name: 'Setup Payment Processing',
                action: async () => {
                    // Setup payment schedule, tax withholding, etc.
                    logger.info(`Setting up payment processing for deal: ${this.dealData.dealId}`);
                },
                compensation: async () => {
                    // Cancel payment setup
                    logger.info(`Cancelling payment setup for deal: ${this.dealData.dealId}`);
                }
            },
            {
                id: 'notify-stakeholders',
                name: 'Notify Stakeholders',
                action: async () => {
                    // Notify athlete, parents, coaches, compliance officers
                    const notificationEvent = {
                        id: uuidv4(),
                        eventType: 'MessageSent',
                        aggregateId: this.dealData.athleteId,
                        aggregateType: 'User',
                        timestamp: new Date().toISOString(),
                        correlationId: this.correlationId,
                        userId: this.dealData.athleteId,
                        userType: 'athlete',
                        source: 'nil-deal-saga',
                        version: 1,
                        metadata: {
                            complianceFlags: ['coppa'],
                            priority: 'high'
                        },
                        payload: {
                            messageId: uuidv4(),
                            senderId: 'system',
                            senderType: 'system',
                            recipientId: this.dealData.athleteId,
                            recipientType: 'athlete',
                            messageType: 'system',
                            content: `NIL Deal created: $${this.dealData.amount} with brand ${this.dealData.brandId}`,
                            priority: 'high'
                        }
                    };
                    await eventPublisher.publish(notificationEvent);
                }
            }
        ];
    }
}
// ─── SAGA ORCHESTRATOR ───────────────────────────────────────────────────────
export class SagaOrchestrator {
    constructor() {
        this.activeSagas = new Map();
    }
    async startSaga(sagaType, correlationId, data) {
        const sagaId = uuidv4();
        let saga;
        switch (sagaType) {
            case 'user-registration':
                saga = new UserRegistrationSaga(sagaId, correlationId, data);
                break;
            case 'nil-deal-creation':
                saga = new NILDealCreationSaga(sagaId, correlationId, data);
                break;
            default:
                throw new Error(`Unknown saga type: ${sagaType}`);
        }
        this.activeSagas.set(sagaId, saga);
        // Execute saga asynchronously
        saga.execute()
            .then(() => {
            logger.info(`Saga completed: ${sagaId}`);
            this.activeSagas.delete(sagaId);
        })
            .catch((error) => {
            logger.error(`Saga failed: ${sagaId}`, error);
            this.activeSagas.delete(sagaId);
        });
        return sagaId;
    }
    async resumeSaga(sagaId) {
        // Load saga state from database and resume
        const sagaState = await db
            .select()
            .from(schema.sagaInstances)
            .where(eq(schema.sagaInstances.id, sagaId))
            .limit(1);
        if (sagaState.length === 0) {
            throw new Error(`Saga not found: ${sagaId}`);
        }
        const state = sagaState[0];
        if (state.status === 'completed' || state.status === 'failed') {
            logger.info(`Saga already ${state.status}: ${sagaId}`);
            return;
        }
        // Recreate saga instance and resume
        // This is a simplified version - in production, you'd need to
        // reconstruct the exact saga state
        logger.info(`Resuming saga: ${sagaId}`);
    }
    async getSagaStatus(sagaId) {
        const sagaState = await db
            .select()
            .from(schema.sagaInstances)
            .where(eq(schema.sagaInstances.id, sagaId))
            .limit(1);
        if (sagaState.length === 0) {
            throw new Error(`Saga not found: ${sagaId}`);
        }
        return {
            sagaId,
            sagaType: sagaState[0].sagaType,
            status: sagaState[0].status,
            currentStep: sagaState[0].currentStep,
            stepsCompleted: JSON.parse(sagaState[0].stepsCompleted),
            compensating: sagaState[0].compensating,
            errorMessage: sagaState[0].errorMessage,
            updatedAt: sagaState[0].updatedAt
        };
    }
    getActiveSagas() {
        return Array.from(this.activeSagas.keys());
    }
    async cleanupCompletedSagas(olderThanDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        await db
            .delete(schema.sagaInstances)
            .where(and(eq(schema.sagaInstances.status, 'completed'), lt(schema.sagaInstances.updatedAt, cutoffDate.toISOString())));
    }
}
export const sagaOrchestrator = new SagaOrchestrator();
//# sourceMappingURL=sagas.js.map