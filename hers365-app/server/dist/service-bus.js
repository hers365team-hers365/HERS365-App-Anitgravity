/**
 * AZURE SERVICE BUS MESSAGING INFRASTRUCTURE
 * Enterprise-grade event-driven messaging with reliability and fault tolerance
 */
import { ServiceBusClient, ServiceBusAdministrationClient } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from './logger';
import { db } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
const defaultConfig = {
    retryOptions: {
        maxRetries: 3,
        retryDelayInMs: 1000,
        maxRetryDelayInMs: 30000
    },
    queueOptions: {
        defaultMaxDeliveryCount: 5,
        lockDuration: 'PT5M', // 5 minutes
        defaultMessageTimeToLive: 'P7D', // 7 days
        deadLetteringOnMessageExpiration: true,
        enablePartitioning: true,
        enableBatchedOperations: true
    },
    topicOptions: {
        defaultMessageTimeToLive: 'P30D', // 30 days
        enablePartitioning: true,
        enableBatchedOperations: true
    }
};
// ─── SERVICE BUS CLIENT ───────────────────────────────────────────────────────
export class AzureServiceBusClient {
    constructor() {
        this.config = {
            ...defaultConfig,
            connectionString: process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
            fullyQualifiedNamespace: process.env.AZURE_SERVICEBUS_NAMESPACE
        };
        if (this.config.connectionString) {
            this.sbClient = new ServiceBusClient(this.config.connectionString, {
                retryOptions: this.config.retryOptions
            });
            this.adminClient = new ServiceBusAdministrationClient(this.config.connectionString);
        }
        else if (this.config.fullyQualifiedNamespace) {
            const credential = new DefaultAzureCredential();
            this.sbClient = new ServiceBusClient(this.config.fullyQualifiedNamespace, credential, { retryOptions: this.config.retryOptions });
            this.adminClient = new ServiceBusAdministrationClient(this.config.fullyQualifiedNamespace, credential);
        }
        else {
            throw new Error('Azure Service Bus connection configuration missing');
        }
    }
    static getInstance() {
        if (!AzureServiceBusClient.instance) {
            AzureServiceBusClient.instance = new AzureServiceBusClient();
        }
        return AzureServiceBusClient.instance;
    }
    // ─── INFRASTRUCTURE MANAGEMENT ──────────────────────────────────────────────
    async ensureInfrastructure() {
        try {
            // Create topics for domain events
            await this.createTopicIfNotExists('user-events', {
                ...this.config.topicOptions,
                requiresDuplicateDetection: true,
                duplicateDetectionHistoryTimeWindow: 'PT10M' // 10 minutes
            });
            await this.createTopicIfNotExists('auth-events', {
                ...this.config.topicOptions,
                requiresDuplicateDetection: true,
                duplicateDetectionHistoryTimeWindow: 'PT5M' // 5 minutes
            });
            await this.createTopicIfNotExists('recruiting-events', {
                ...this.config.topicOptions,
                requiresDuplicateDetection: true,
                duplicateDetectionHistoryTimeWindow: 'PT15M' // 15 minutes
            });
            await this.createTopicIfNotExists('payment-events', {
                ...this.config.topicOptions,
                requiresDuplicateDetection: true,
                duplicateDetectionHistoryTimeWindow: 'PT30M' // 30 minutes
            });
            await this.createTopicIfNotExists('audit-events', {
                ...this.config.topicOptions,
                enableBatchedOperations: false // Audit events must be processed individually
            });
            await this.createTopicIfNotExists('system-events', {
                ...this.config.topicOptions
            });
            // Create queues for service-specific processing
            await this.createQueueIfNotExists('user-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('auth-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('recruiting-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('payment-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('notification-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('analytics-service-queue', this.config.queueOptions);
            await this.createQueueIfNotExists('audit-service-queue', this.config.queueOptions);
            // Create dead letter queues for failed processing
            await this.createQueueIfNotExists('dead-letter-queue', {
                ...this.config.queueOptions,
                defaultMessageTimeToLive: 'P90D' // 90 days retention
            });
            logger.info('Azure Service Bus infrastructure initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize Service Bus infrastructure:', error);
            throw error;
        }
    }
    async createTopicIfNotExists(topicName, options) {
        try {
            await this.adminClient.createTopic(topicName, options);
            logger.info(`Created topic: ${topicName}`);
        }
        catch (error) {
            if (error.code !== 'MessageEntityAlreadyExistsError') {
                throw error;
            }
        }
    }
    async createQueueIfNotExists(queueName, options) {
        try {
            await this.adminClient.createQueue(queueName, options);
            logger.info(`Created queue: ${queueName}`);
        }
        catch (error) {
            if (error.code !== 'MessageEntityAlreadyExistsError') {
                throw error;
            }
        }
    }
    // ─── EVENT PUBLISHING ───────────────────────────────────────────────────────
    async publishEvent(event) {
        try {
            // Store event in database first for reliability
            await this.storeEvent(event);
            // Determine topic based on event type
            const topicName = this.getTopicForEvent(event.eventType);
            // Create Service Bus message
            const message = {
                messageId: event.id,
                correlationId: event.correlationId,
                subject: event.eventType,
                body: event,
                applicationProperties: {
                    aggregateId: event.aggregateId,
                    aggregateType: event.aggregateType,
                    version: event.version,
                    priority: event.metadata?.priority || 'medium',
                    userId: event.userId ?? null,
                    userType: event.userType ?? null,
                    complianceFlags: event.metadata?.complianceFlags?.join(',') ?? null,
                    idempotencyKey: event.metadata?.idempotencyKey ?? null
                },
                timeToLive: event.metadata?.ttl ? event.metadata?.ttl * 1000 : undefined
            };
            // Publish to topic
            const sender = this.sbClient.createSender(topicName);
            await sender.sendMessages(message);
            await sender.close();
            logger.info(`Published event: ${event.eventType} (${event.id}) to ${topicName}`);
        }
        catch (error) {
            logger.error(`Failed to publish event ${event.id}:`, error);
            throw error;
        }
    }
    async publishEvents(events) {
        if (events.length === 0)
            return;
        // Group events by topic
        const eventsByTopic = new Map();
        for (const event of events) {
            const topic = this.getTopicForEvent(event.eventType);
            if (!eventsByTopic.has(topic)) {
                eventsByTopic.set(topic, []);
            }
            eventsByTopic.get(topic).push(event);
        }
        // Publish batches by topic
        for (const [topicName, topicEvents] of eventsByTopic) {
            try {
                // Store events in database
                await Promise.all(topicEvents.map(event => this.storeEvent(event)));
                // Create batch
                const sender = this.sbClient.createSender(topicName);
                const batch = await sender.createMessageBatch();
                for (const event of topicEvents) {
                    const message = {
                        messageId: event.id,
                        correlationId: event.correlationId,
                        subject: event.eventType,
                        body: event,
                        applicationProperties: {
                            aggregateId: event.aggregateId,
                            aggregateType: event.aggregateType,
                            version: event.version,
                            priority: event.metadata?.priority || 'medium',
                            userId: event.userId ?? null,
                            userType: event.userType ?? null,
                            complianceFlags: event.metadata?.complianceFlags?.join(',') ?? null,
                            idempotencyKey: event.metadata?.idempotencyKey ?? null
                        },
                        timeToLive: event.metadata?.ttl ? event.metadata?.ttl * 1000 : undefined
                    };
                    const added = batch.tryAddMessage(message);
                    if (!added) {
                        // Send current batch and create new one
                        await sender.sendMessages(batch);
                        const newBatch = await sender.createMessageBatch();
                        newBatch.tryAddMessage(message);
                        Object.assign(batch, newBatch);
                    }
                }
                if (batch.count > 0) {
                    await sender.sendMessages(batch);
                }
                await sender.close();
                logger.info(`Published ${topicEvents.length} events to ${topicName}`);
            }
            catch (error) {
                logger.error(`Failed to publish batch to ${topicName}:`, error);
                throw error;
            }
        }
    }
    getTopicForEvent(eventType) {
        const topicMap = {
            // User events
            'UserCreated': 'user-events',
            'UserUpdated': 'user-events',
            'UserDeleted': 'user-events',
            // Auth events
            'LoginAttempted': 'auth-events',
            'LoginSuccessful': 'auth-events',
            'LoginFailed': 'auth-events',
            'TokenRefreshed': 'auth-events',
            // Recruiting events
            'ScholarshipOffered': 'recruiting-events',
            'ScholarshipAccepted': 'recruiting-events',
            'MessageSent': 'recruiting-events',
            // Payment events
            'PaymentProcessed': 'payment-events',
            'NILDealCreated': 'payment-events',
            // Audit events
            'AuditEventLogged': 'audit-events',
            'ComplianceViolation': 'audit-events',
            // System events
            'ServiceHealth': 'system-events',
            'CircuitBreaker': 'system-events'
        };
        return topicMap[eventType] || 'system-events';
    }
    // ─── EVENT STORAGE ──────────────────────────────────────────────────────────
    async storeEvent(event) {
        try {
            await db.insert(schema.eventStore).values({
                id: event.id,
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                aggregateType: event.aggregateType,
                timestamp: event.timestamp,
                correlationId: event.correlationId,
                causationId: event.causationId,
                userId: event.userId,
                userType: event.userType,
                source: event.source,
                version: event.version,
                metadata: JSON.stringify(event.metadata),
                payload: JSON.stringify(event.payload),
                processed: false,
                retryCount: 0,
                maxRetries: 3,
                deadLetter: false,
                createdAt: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error(`Failed to store event ${event.id}:`, error);
            throw error;
        }
    }
    async markEventProcessed(eventId, success, errorMessage) {
        try {
            await db
                .update(schema.eventStore)
                .set({
                processed: true,
                processedAt: new Date().toISOString(),
                errorMessage: success ? undefined : errorMessage
            })
                .where(eq(schema.eventStore.id, eventId));
        }
        catch (error) {
            logger.error(`Failed to mark event ${eventId} as processed:`, error);
        }
    }
    async incrementEventRetry(eventId) {
        try {
            const event = await db
                .select()
                .from(schema.eventStore)
                .where(eq(schema.eventStore.id, eventId))
                .limit(1);
            const eventRecord = event[0];
            if (!eventRecord)
                return false;
            const newRetryCount = (eventRecord.retryCount || 0) + 1;
            const shouldDeadLetter = newRetryCount >= (eventRecord.maxRetries || 3);
            await db
                .update(schema.eventStore)
                .set({
                retryCount: newRetryCount,
                deadLetter: shouldDeadLetter,
                deadLetterReason: shouldDeadLetter ? 'Max retries exceeded' : undefined,
                errorMessage: shouldDeadLetter ? 'Event moved to dead letter queue' : undefined
            })
                .where(eq(schema.eventStore.id, eventId));
            return shouldDeadLetter;
        }
        catch (error) {
            logger.error(`Failed to increment retry for event ${eventId}:`, error);
            return false;
        }
    }
    // ─── EVENT CONSUMPTION ──────────────────────────────────────────────────────
    async subscribeToQueue(queueName, messageHandler, errorHandler) {
        const receiver = this.sbClient.createReceiver(queueName, {
            receiveMode: 'peekLock'
        });
        receiver.subscribe({
            processMessage: async (message) => {
                try {
                    await messageHandler(message);
                    await receiver.completeMessage(message);
                }
                catch (error) {
                    logger.error(`Error processing message ${message.messageId}:`, error);
                    // Increment retry count
                    const shouldDeadLetter = await this.incrementEventRetry(String(message.messageId));
                    if (shouldDeadLetter) {
                        await receiver.deadLetterMessage(message, {
                            deadLetterReason: 'Max retries exceeded',
                            deadLetterErrorDescription: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    else {
                        await receiver.abandonMessage(message);
                    }
                }
            },
            processError: async (error) => {
                logger.error(`Service Bus error for queue ${queueName}:`, error);
                if (errorHandler) {
                    await errorHandler(error);
                }
            }
        });
        logger.info(`Subscribed to queue: ${queueName}`);
        return receiver;
    }
    async subscribeToTopic(topicName, subscriptionName, messageHandler, errorHandler) {
        // Ensure subscription exists
        await this.createSubscriptionIfNotExists(topicName, subscriptionName);
        const receiver = this.sbClient.createReceiver(topicName, subscriptionName, {
            receiveMode: 'peekLock'
        });
        receiver.subscribe({
            processMessage: async (message) => {
                try {
                    await messageHandler(message);
                    await receiver.completeMessage(message);
                }
                catch (error) {
                    logger.error(`Error processing message ${message.messageId} from ${topicName}/${subscriptionName}:`, error);
                    // Increment retry count
                    const shouldDeadLetter = await this.incrementEventRetry(String(message.messageId));
                    if (shouldDeadLetter) {
                        await receiver.deadLetterMessage(message, {
                            deadLetterReason: 'Max retries exceeded',
                            deadLetterErrorDescription: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    else {
                        await receiver.abandonMessage(message);
                    }
                }
            },
            processError: async (error) => {
                logger.error(`Service Bus error for ${topicName}/${subscriptionName}:`, error);
                if (errorHandler) {
                    await errorHandler(error);
                }
            }
        });
        logger.info(`Subscribed to topic: ${topicName}/${subscriptionName}`);
        return receiver;
    }
    async createSubscriptionIfNotExists(topicName, subscriptionName) {
        try {
            await this.adminClient.createSubscription(topicName, subscriptionName, {
                lockDuration: 'PT5M',
                defaultMessageTimeToLive: 'P7D',
                deadLetteringOnMessageExpiration: true,
                enableBatchedOperations: true
            });
            logger.info(`Created subscription: ${topicName}/${subscriptionName}`);
        }
        catch (error) {
            if (error.code !== 'MessageEntityAlreadyExistsError') {
                throw error;
            }
        }
    }
    // ─── HEALTH MONITORING ──────────────────────────────────────────────────────
    async getQueueStats(queueName) {
        const runtimeProperties = await this.adminClient.getQueueRuntimeProperties(queueName);
        return {
            activeMessageCount: runtimeProperties.activeMessageCount,
            deadLetterMessageCount: runtimeProperties.deadLetterMessageCount,
            scheduledMessageCount: runtimeProperties.scheduledMessageCount,
            transferMessageCount: runtimeProperties.transferMessageCount
        };
    }
    async getTopicStats(topicName) {
        const runtimeProperties = await this.adminClient.getTopicRuntimeProperties(topicName);
        return {
            subscriptionCount: runtimeProperties.subscriptionCount || 0,
            scheduledMessageCount: runtimeProperties.scheduledMessageCount
        };
    }
    // ─── CLEANUP ────────────────────────────────────────────────────────────────
    async close() {
        await this.sbClient.close();
        logger.info('Azure Service Bus client closed');
    }
}
// ─── EVENT PUBLISHER UTILITY ─────────────────────────────────────────────────
export class EventPublisher {
    constructor() {
        this.sbClient = AzureServiceBusClient.getInstance();
    }
    static getInstance() {
        if (!EventPublisher.instance) {
            EventPublisher.instance = new EventPublisher();
        }
        return EventPublisher.instance;
    }
    async publish(event) {
        await this.sbClient.publishEvent(event);
    }
    async publishBatch(events) {
        await this.sbClient.publishEvents(events);
    }
    // Helper methods for common events
    async publishUserCreated(userData) {
        const event = {
            id: uuidv4(),
            eventType: 'UserCreated',
            aggregateId: userData.userId,
            aggregateType: 'User',
            timestamp: new Date().toISOString(),
            correlationId: userData.correlationId,
            userId: userData.userId,
            userType: userData.userType,
            source: userData.source,
            version: 1,
            metadata: {
                complianceFlags: ['gdpr', userData.userType === 'athlete' ? 'coppa' : undefined].filter(Boolean),
                priority: 'high',
                idempotencyKey: crypto.randomUUID()
            },
            payload: {
                userId: userData.userId,
                userType: userData.userType,
                email: userData.email,
                name: userData.name,
                metadata: userData.metadata
            }
        };
        await this.publish(event);
    }
    async publishLoginAttempted(loginData) {
        const event = {
            id: uuidv4(),
            eventType: 'LoginAttempted',
            aggregateId: loginData.email, // Use email as aggregate for login attempts
            aggregateType: 'LoginAttempt',
            timestamp: new Date().toISOString(),
            correlationId: loginData.correlationId,
            source: loginData.source,
            version: 1,
            metadata: {
                priority: 'high',
                ttl: 3600, // 1 hour
                idempotencyKey: crypto.randomUUID()
            },
            payload: {
                email: loginData.email,
                userType: loginData.userType,
                ipAddress: loginData.ipAddress,
                userAgent: loginData.userAgent,
                deviceFingerprint: loginData.deviceFingerprint,
                location: loginData.location
            }
        };
        await this.publish(event);
    }
}
export const eventPublisher = EventPublisher.getInstance();
export const serviceBusClient = AzureServiceBusClient.getInstance();
//# sourceMappingURL=service-bus.js.map