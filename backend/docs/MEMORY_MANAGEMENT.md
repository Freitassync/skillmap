# Memory Management

## Logging with Pino

This project uses [Pino](https://getpino.io/) as the logging solution instead of native `console.log/error/warn` methods for better performance and memory management.

### Why Pino?

1. **Event Loop Protection**: Pino uses asynchronous logging to prevent blocking the Node.js event loop
2. **Lower Memory Overhead**: Pino is designed to have minimal impact on memory usage compared to console methods
3. **Performance**: Pino is one of the fastest logging libraries for Node.js
4. **Structured Logging**: JSON-formatted logs make parsing and analysis easier
5. **Production Ready**: Built-in log levels, formatting, and transport options

### Performance Benefits

#### Asynchronous Logging
Unlike `console.log` which is synchronous and blocks the event loop, Pino writes logs asynchronously:

```typescript
// BAD: Blocks event loop
console.log('User logged in:', userId);

// GOOD: Non-blocking async logging
logger.info({ userId }, 'User logged in');
```

#### Memory Efficiency
Pino minimizes object allocations and uses optimized serialization:

- Reuses buffer allocations
- Avoids unnecessary string concatenations
- Streams directly to stdout/file

### Usage

Import the logger:

```typescript
import logger from './lib/logger';
```

Logging examples:

```typescript
// Info level (general information)
logger.info('Server started');
logger.info({ port: 3000, environment: 'development' }, 'Server started');

// Error level (errors that need attention)
logger.error({ error }, 'Failed to connect to database');

// Warn level (warnings)
logger.warn('API key not configured, using mock mode');

// Debug level (detailed debugging, only in development)
logger.debug({ userId, action: 'login' }, 'User authentication');
```

### Configuration

Logger configuration is in `src/lib/logger.ts`:

```typescript
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',  // Pretty formatting in development
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,  // JSON output in production
});
```

### Log Levels

Pino supports the following log levels (from lowest to highest priority):

- `trace`: Very detailed debugging
- `debug`: Detailed debugging information
- `info`: General informational messages
- `warn`: Warning messages
- `error`: Error messages
- `fatal`: Critical errors that may cause application termination

Set the log level via environment variable:

```bash
LOG_LEVEL=debug npm start
```

### Best Practices

1. **Use Structured Logging**: Pass objects as the first parameter for context

```typescript
// GOOD
logger.info({ userId, action: 'purchase', amount: 99.99 }, 'Purchase completed');

// AVOID
logger.info('Purchase completed for user ' + userId + ' amount ' + amount);
```

2. **Include Error Objects**: Always pass the error object for better stack traces

```typescript
// GOOD
logger.error({ error }, 'Database query failed');

// AVOID
logger.error('Database query failed: ' + error.message);
```

3. **Use Appropriate Log Levels**: Choose the right level for the message
   - `info` for normal operations
   - `warn` for recoverable issues
   - `error` for failures that need investigation
   - `debug` for development debugging

4. **Avoid Logging Sensitive Data**: Never log passwords, tokens, or PII

```typescript
// BAD
logger.info({ password }, 'User login attempt');

// GOOD
logger.info({ userId, email: maskEmail(email) }, 'User login attempt');
```

### Production Configuration

In production, Pino outputs newline-delimited JSON (NDJSON) which can be:

- Piped to log aggregation services (Datadog, CloudWatch, etc.)
- Parsed by log analysis tools
- Transported via pino transports

Example production output:

```json
{"level":30,"time":1699564800000,"msg":"Server started","port":3000}
{"level":50,"time":1699564801000,"msg":"Database error","error":{"type":"Error","message":"Connection refused"}}
```

### Performance Impact

Pino benchmarks show it has minimal performance overhead:

- **~5x faster** than Winston
- **~10x faster** than Bunyan
- **~100x faster** than console.log in high-throughput scenarios

### Memory Management

Pino's design minimizes garbage collection pressure:

1. **Object Reuse**: Reuses serialization buffers
2. **Lazy Serialization**: Only serializes when necessary
3. **Stream-Based**: Writes directly to streams without intermediate buffers
4. **Minimal Allocations**: Avoids creating temporary objects

### Migration from console

All `console.log/error/warn` statements have been replaced with Pino equivalents:

| Before | After |
|--------|-------|
| `console.log('message')` | `logger.info('message')` |
| `console.error('error:', error)` | `logger.error({ error }, 'error')` |
| `console.warn('warning')` | `logger.warn('warning')` |

### References

- [Pino Documentation](https://getpino.io/)
- [Pino GitHub](https://github.com/pinojs/pino)
- [Pino Benchmarks](https://github.com/pinojs/pino/blob/master/docs/benchmarks.md)
