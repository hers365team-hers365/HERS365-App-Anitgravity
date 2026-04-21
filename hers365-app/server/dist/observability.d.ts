/**
 * DISTRIBUTED TRACING AND OBSERVABILITY
 * OpenTelemetry integration for microservices observability
 */
import { Span, Tracer } from '@opentelemetry/api';
export declare class TracingService {
    private static instance;
    private tracer;
    private provider;
    private constructor();
    static getInstance(): TracingService;
    private initializeTracing;
    getTracer(): Tracer;
    /**
     * Create a new span for a service operation
     */
    startSpan(name: string, options?: {
        parentSpan?: Span;
        attributes?: Record<string, string | number | boolean>;
    }): Span;
    /**
     * Wrap an async operation with tracing
     */
    traceAsync<T>(name: string, operation: (span: Span) => Promise<T>, options?: {
        attributes?: Record<string, string | number | boolean>;
    }): Promise<T>;
    /**
     * Add event to current span
     */
    addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
    /**
     * Set attributes on current span
     */
    setAttributes(attributes: Record<string, string | number | boolean>): void;
    /**
     * Get current span context for correlation
     */
    getCurrentSpan(): Span | undefined;
    shutdown(): Promise<void>;
}
export declare class MetricsService {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): MetricsService;
    private initializeMetrics;
    /**
     * Record a metric
     */
    recordMetric(name: string, value: number, type: 'counter' | 'gauge' | 'histogram', labels?: Record<string, string>): void;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>): void;
    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record histogram value
     */
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Get all metrics
     */
    getMetrics(): Record<string, any>;
    /**
     * Export metrics in Prometheus format
     */
    exportPrometheus(): string;
    private startPeriodicReporting;
    private resetCounters;
}
export declare class CorrelationService {
    private static instance;
    private constructor();
    static getInstance(): CorrelationService;
    /**
     * Generate a correlation ID for request tracing
     */
    generateCorrelationId(): string;
    /**
     * Extract correlation ID from request headers
     */
    extractCorrelationId(headers: any): string;
    /**
     * Create distributed tracing context
     */
    createTracingContext(correlationId: string, serviceName: string, operation: string): any;
    private generateTraceId;
    private generateSpanId;
}
export declare const tracing: TracingService;
export declare const metrics: MetricsService;
export declare const correlation: CorrelationService;
