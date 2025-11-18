import pino from 'pino';

/**
 * Pino logger configuration
 *
 * Pino is used instead of console.log for better performance and memory management:
 * - Asynchronous logging prevents blocking the event loop
 * - Structured logging with JSON output
 * - Lower memory overhead compared to console methods
 * - Production-ready with log levels and formatting
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});

export default logger;
