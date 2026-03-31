/**
 * H.E.R.S.365 Structured Logger
 * Production-ready logging with levels, timestamps, and context
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
interface LogContext {
    userId?: number;
    requestId?: string;
    [key: string]: any;
}
export declare const logger: {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error | LogContext): void;
};
/**
 * User-safe error handler - never exposes internal details to clients
 */
export declare function handleError(error: Error, userMessage?: string): {
    userMessage: string;
    internalLog: string;
};
/**
 * Async wrapper with automatic error handling
 */
export declare function withErrorHandling<T>(fn: () => Promise<T>, userMessage?: string): Promise<{
    data?: T;
    error?: string;
}>;
export {};
