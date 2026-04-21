/**
 * MICROSERVICES ARCHITECTURE
 * Bounded contexts and service definitions for event-driven architecture
 */
import express from 'express';
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import { DomainEvent } from './events';
export declare abstract class Microservice {
    protected app: express.Application;
    protected serviceName: string;
    protected serviceId: string;
    protected port: number;
    protected receivers: any[];
    constructor(serviceName: string, port: number);
    private setupMiddleware;
    protected abstract setupRoutes(): void;
    protected abstract setupEventHandlers(): void;
    private setupHealthChecks;
    protected abstract getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, any>;
    }>;
    protected isReady(): Promise<boolean>;
    start(): Promise<void>;
    private registerService;
    protected abstract startEventSubscriptions(): Promise<void>;
    stop(): Promise<void>;
    protected publishEvent(event: DomainEvent): Promise<void>;
    protected handleEvent(message: ServiceBusReceivedMessage): Promise<void>;
    protected abstract processEvent(event: DomainEvent): Promise<void>;
}
export declare class AuthenticationService extends Microservice {
    constructor(port?: number);
    protected setupRoutes(): void;
    protected setupEventHandlers(): void;
    protected startEventSubscriptions(): Promise<void>;
    protected processEvent(event: DomainEvent): Promise<void>;
    private handleLogin;
    private handleRefresh;
    private handleLogout;
    private handleMFASetup;
    private handleMFAVerify;
    private handleUserCreatedEvent;
    private handleUserUpdatedEvent;
    private handleAuthQueueMessage;
    private processUserCreated;
    private processUserUpdated;
    private processUserDeleted;
    protected getHealthStatus(): Promise<{
        status: "healthy";
        checks: {
            database: {
                status: string;
                responseTime: number;
            };
            servicebus: {
                status: string;
                responseTime: number;
            };
        };
    }>;
}
export declare class UserManagementService extends Microservice {
    constructor(port?: number);
    protected setupRoutes(): void;
    protected setupEventHandlers(): void;
    protected startEventSubscriptions(): Promise<void>;
    protected processEvent(event: DomainEvent): Promise<void>;
    private handleCreateUser;
    private handleUpdateUser;
    private handleDeleteUser;
    private handleGetUser;
    private handleLoginSuccessful;
    private handleUserQueueMessage;
    private processLoginSuccessful;
    protected getHealthStatus(): Promise<{
        status: "healthy";
        checks: {
            database: {
                status: string;
                responseTime: number;
            };
            servicebus: {
                status: string;
                responseTime: number;
            };
        };
    }>;
}
export declare class ServiceOrchestrator {
    private services;
    private serviceDiscovery;
    startServices(): Promise<void>;
    stopServices(): Promise<void>;
    getService(serviceName: string): Microservice | undefined;
    getAllServices(): Microservice[];
}
export declare const serviceOrchestrator: ServiceOrchestrator;
