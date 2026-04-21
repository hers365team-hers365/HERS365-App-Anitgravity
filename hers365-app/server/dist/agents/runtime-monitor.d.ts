export interface HealthStatus {
    component: string;
    status: string;
    latency?: number;
    error?: string;
}
export interface ErrorLog {
    timestamp: string;
    level: string;
    message: string;
}
export interface Metrics {
    requests: number;
    errors: number;
    avgLatency: number;
    uptime: number;
}
export declare class HealthMonitor {
    private baseUrl;
    constructor(baseUrl?: string);
    checkHealth(): Promise<HealthStatus[]>;
}
export declare class ErrorTracker {
    private errors;
    log(level: string, message: string): void;
    getErrors(): ErrorLog[];
}
export declare class PerformanceMonitor {
    private metrics;
    recordRequest(latencyMs: number): void;
    recordError(): void;
    getMetrics(): Metrics;
}
export declare class RuntimeMonitorOrchestrator {
    runOnce(): Promise<void>;
    start(): void;
    stop(): void;
}
