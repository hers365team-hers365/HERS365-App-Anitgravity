/**
 * SAGA PATTERN IMPLEMENTATION
 * Complex transaction management across microservices
 */
export interface SagaStep {
    id: string;
    name: string;
    action: () => Promise<void>;
    compensation?: () => Promise<void>;
    timeout?: number;
}
export interface SagaDefinition {
    name: string;
    steps: SagaStep[];
    timeout: number;
}
export declare abstract class Saga {
    protected sagaId: string;
    protected correlationId: string;
    protected aggregateId: string;
    protected aggregateType: string;
    protected steps: SagaStep[];
    protected currentStepIndex: number;
    protected completedSteps: string[];
    protected compensating: boolean;
    constructor(sagaId: string, correlationId: string, aggregateId: string, aggregateType: string, steps: SagaStep[]);
    execute(): Promise<void>;
    private compensate;
    private saveSagaState;
    protected abstract defineSteps(): SagaStep[];
}
export declare class UserRegistrationSaga extends Saga {
    private userData;
    constructor(sagaId: string, correlationId: string, userData: any);
    protected defineSteps(): SagaStep[];
}
export declare class NILDealCreationSaga extends Saga {
    private dealData;
    constructor(sagaId: string, correlationId: string, dealData: any);
    protected defineSteps(): SagaStep[];
}
export declare class SagaOrchestrator {
    private activeSagas;
    startSaga(sagaType: string, correlationId: string, data: any): Promise<string>;
    resumeSaga(sagaId: string): Promise<void>;
    getSagaStatus(sagaId: string): Promise<any>;
    getActiveSagas(): string[];
    cleanupCompletedSagas(olderThanDays?: number): Promise<void>;
}
export declare const sagaOrchestrator: SagaOrchestrator;
