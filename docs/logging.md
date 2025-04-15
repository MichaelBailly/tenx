# Logging Guide for TenX2

This guide describes the standardized logging implementation using Pino.

## Overview

We've replaced all `console.log` statements with structured logging using [Pino](https://github.com/pinojs/pino), a fast and low-overhead logging library. This provides:

- Consistent log formatting
- Log levels (trace, debug, info, warn, error, fatal)
- Environment-aware logging (more verbose in development, less in production)
- Structured data with context

## Usage

### Server-side Logging

Import the appropriate logger from the utilities:

```typescript
import {
  serverLogger,
  authLogger,
  dbLogger,
  apiLogger,
} from "~/server/utils/logger";

// Basic logging
serverLogger.info("Server started");

// With context
dbLogger.info(
  { collection: "users", operation: "find" },
  "Database query executed"
);

// Error logging
try {
  // Some operation
} catch (error) {
  authLogger.error({ err: error }, "Authentication failed");
}
```

### Client-side Logging

Use the provided composables:

```typescript
<script setup>
import { useLogger, useAuthLogger, useAppLogger, useApiLogger } from "~/composables/useLogger";

// General logger with custom context
const logger = useLogger('custom-component');

// Specialized loggers
const authLogger = useAuthLogger();
const appLogger = useAppLogger();
const apiLogger = useApiLogger();

// Usage examples
logger.debug("Component mounted");
authLogger.info({ userId: "123" }, "User logged in");
appLogger.warn("Application slow");
apiLogger.error({ endpoint: "/api/users", status: 500 }, "API call failed");
</script>
```

### Using the Plugin (Available Globally)

The logger is also available via the Nuxt plugin system:

```typescript
<script setup>
  // Access via inject const {($logger, $appLogger, $authLogger, $apiLogger)} =
  useNuxtApp(); // Create a logger with custom context const logger =
  $logger('my-component'); // Use specialized loggers const appLogger =
  $appLogger(); appLogger.info("Application event");
</script>
```

## Log Levels

In order of verbosity (most to least):

1. `trace` - Very detailed tracing
2. `debug` - Debugging information
3. `info` - Informational messages (default in development)
4. `warn` - Warning conditions
5. `error` - Error conditions
6. `fatal` - Critical conditions

In production, the default level is `info`, which means `debug` and `trace` logs are not output.

## Best Practices

1. **Use structured logging**: Pass an object as the first parameter with context data.

   ```typescript
   logger.info({ userId: "123", action: "login" }, "User logged in");
   ```

2. **Choose appropriate log levels**:

   - `debug`: Development-only detailed information
   - `info`: Regular operation information
   - `warn`: Unexpected but handled conditions
   - `error`: Errors that should be investigated
   - `fatal`: Critical failures requiring immediate attention

3. **Include contextual data**: Always include relevant data objects in logs for better debugging.

4. **Error logging**: Always include the error object with the `err` property.
   ```typescript
   try {
     // code
   } catch (error) {
     logger.error({ err: error }, "Operation failed");
   }
   ```

## Configuration

The logging configuration is in `server/utils/logger.ts` for server-side logging and `composables/useLogger.ts` for client-side logging.

In development mode, logs are colorized and formatted for readability using `pino-pretty`.
