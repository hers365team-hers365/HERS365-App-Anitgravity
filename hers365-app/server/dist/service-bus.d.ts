/**
 * AZURE SERVICE BUS MESSAGING INFRASTRUCTURE
 * Enterprise-grade event-driven messaging with reliability and fault tolerance
 */
import { ServiceBusReceivedMessage, ServiceBusReceiver } from '@azure/service-bus';
import { DomainEvent } from './events';
export declare class AzureServiceBusClient {
    private static instance;
    private sbClient;
    private adminClient;
    private config;
    private constructor();
    static getInstance(): AzureServiceBusClient;
    ensureInfrastructure(): Promise<void>;
    private createTopicIfNotExists;
    private createQueueIfNotExists;
    publishEvent(event: DomainEvent): Promise<void>;
    publishEvents(events: DomainEvent[]): Promise<void>;
    private getTopicForEvent;
    private storeEvent;
    markEventProcessed(eventId: string, success: boolean, errorMessage?: string): Promise<void>;
    incrementEventRetry(eventId: string): Promise<boolean>;
    subscribeToQueue(queueName: string, messageHandler: (message: ServiceBusReceivedMessage) => Promise<void>, errorHandler?: (error: any) => Promise<void>): Promise<ServiceBusReceiver>;
    subscribeToTopic(topicName: string, subscriptionName: string, messageHandler: (message: ServiceBusReceivedMessage) => Promise<void>, errorHandler?: (error: any) => Promise<void>): Promise<ServiceBusReceiver>;
    private createSubscriptionIfNotExists;
    getQueueStats(queueName: string): Promise<{
        activeMessageCount: number;
        deadLetterMessageCount: number;
        scheduledMessageCount: number;
        transferMessageCount: number;
    }>;
    getTopicStats(topicName: string): Promise<{
        subscriptionCount: number;
        scheduledMessageCount: number;
    }>;
    close(): Promise<void>;
}
export declare class EventPublisher {
    private static instance;
    private sbClient;
    private constructor();
    static getInstance(): EventPublisher;
    publish(event: DomainEvent): Promise<void>;
    publishBatch(events: DomainEvent[]): Promise<void>;
    publishUserCreated(userData: {
        userId: string;
        userType: string;
        email: string;
        name: string;
        correlationId: string;
        source: string;
        metadata?: Record<string, any>;
    }): Promise<void>;
    publishLoginAttempted(loginData: {
        email: string;
        userType: string;
        ipAddress: string;
        userAgent: string;
        correlationId: string;
        source: string;
        deviceFingerprint?: string;
        location?: any;
    }): Promise<void>;
}
export declare const eventPublisher: EventPublisher;
export declare const serviceBusClient: AzureServiceBusClient;
