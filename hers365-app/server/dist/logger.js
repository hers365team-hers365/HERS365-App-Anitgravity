/**
 * H.E.R.S.365 Structured Logger
 * Production-ready logging with levels, timestamps, and context
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
const currentLevel = process.env.LOG_LEVEL
    ? LogLevel[process.env.LOG_LEVEL]
    : LogLevel.INFO;
function formatMessage(level, message, context) {
    const timestamp = new Date().toISOString();
    const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${ctxStr}`;
}
export const logger = {
    debug(message, context) {
        if (currentLevel <= LogLevel.DEBUG) {
            console.debug(formatMessage('DEBUG', message, context));
        }
    },
    info(message, context) {
        if (currentLevel <= LogLevel.INFO) {
            console.info(formatMessage('INFO', message, context));
        }
    },
    warn(message, context) {
        if (currentLevel <= LogLevel.WARN) {
            console.warn(formatMessage('WARN', message, context));
        }
    },
    error(message, error) {
        if (currentLevel <= LogLevel.ERROR) {
            const context = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(formatMessage('ERROR', message, context));
        }
    },
};
/**
 * User-safe error handler - never exposes internal details to clients
 */
export function handleError(error, userMessage = 'An unexpected error occurred') {
    const isDev = process.env.NODE_ENV !== 'production';
    return {
        userMessage, // Safe message for UI
        internalLog: isDev ? `${error.message}\n${error.stack}` : `Error: ${error.message}`, // Detailed for logs
    };
}
/**
 * Async wrapper with automatic error handling
 */
export async function withErrorHandling(fn, userMessage = 'Operation failed') {
    try {
        const data = await fn();
        return { data };
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const { internalLog } = handleError(error, userMessage);
        logger.error(internalLog);
        return { error: userMessage };
    }
}
//# sourceMappingURL=logger.js.map