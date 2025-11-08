# GothBot Module Development Guide

> Complete guide for building modules for [GothomationBot v2.0](https://github.com/GothUncc/gothomationbotV2)

## Table of Contents

- [Overview](#overview)
- [Module System Architecture](#module-system-architecture)
- [Getting Started](#getting-started)
- [Module Structure](#module-structure)
- [Module Context API](#module-context-api)
- [Event System](#event-system)
- [Storage API](#storage-api)
- [Configuration Schema](#configuration-schema)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Security & Sandboxing](#security--sandboxing)
- [Testing Your Module](#testing-your-module)
- [Publishing to Marketplace](#publishing-to-marketplace)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The GothBot module system enables **hot-loadable, sandboxed extensions** that extend bot functionality without requiring restarts. Modules can:

- React to platform events (follows, subscriptions, chat messages, etc.)
- Store persistent data in PostgreSQL
- Add custom API routes
- Provide configuration through auto-generated UI forms
- Contribute dashboard widgets (future)
- Run in isolated sandboxes with resource limits

**System Requirements:**
- GothBot v2.0.116 or higher
- Module Framework v1.0.0 or higher

---

## Module System Architecture

### Core Components

#### 1. ModuleRuntime
Located at `src/core/modules/ModuleRuntime.ts`

**Responsibilities:**
- Loads modules from database into isolated execution contexts
- Manages module lifecycle (initialize → start → stop → shutdown)
- Enforces security boundaries and resource limits
- Handles hot-reloading without bot restart

**Resource Limits:**
- Memory: 128MB per module (configurable)
- Execution timeout: 5 seconds (configurable)
- Sandboxed execution environment

#### 2. ModuleContext
Located at `src/core/modules/ModuleContext.ts`

**Responsibilities:**
- Provides controlled API surface for modules
- Handles event subscription/emission
- Manages module-scoped storage
- Provides module-attributed logging
- Manages configuration and change notifications

#### 3. Database Schema

**InstalledModule Table:**
```sql
CREATE TABLE "InstalledModule" (
  id              TEXT PRIMARY KEY,
  "moduleId"      TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  version         TEXT NOT NULL,
  enabled         BOOLEAN DEFAULT false,
  code            TEXT NOT NULL,           -- Bundled module code
  config          JSONB DEFAULT '{}',
  metadata        JSONB NOT NULL,
  "updateAvailable" BOOLEAN DEFAULT false,
  "latestVersion" TEXT,
  "installedAt"   TIMESTAMP DEFAULT now(),
  "lastLoadedAt"  TIMESTAMP,
  "updatedAt"     TIMESTAMP DEFAULT now()
);
```

**ModuleData Table:**
```sql
CREATE TABLE "ModuleData" (
  id         TEXT PRIMARY KEY,
  "moduleId" TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now(),
  UNIQUE("moduleId", key)
);
```

---

## Getting Started

### Minimal Module Example

Every module must export a default object with `name` and `version`:

```javascript
export default {
  name: 'my-first-module',
  version: '1.0.0',

  async initialize(context) {
    context.logger.info('Module loaded!');
  }
};
```

### Hello World Module

Complete example demonstrating core features:

```javascript
export default {
  name: 'hello-world',
  version: '1.0.0',

  // Configuration schema (generates UI automatically)
  configSchema: {
    greeting: {
      type: 'string',
      label: 'Greeting Message',
      description: 'Message to display',
      default: 'Hello from GothBot!',
      required: false
    },
    logInterval: {
      type: 'number',
      label: 'Log Interval (seconds)',
      default: 60,
      min: 10,
      max: 3600
    }
  },

  // Module state
  intervalId: null,
  eventCount: 0,

  // Lifecycle: Initialize
  async initialize(context) {
    context.logger.info('Initializing', {
      moduleId: context.moduleId,
      botVersion: context.botVersion
    });

    // Load previous state
    const runCount = await context.storage.get('runCount') || 0;
    await context.storage.set('runCount', runCount + 1);

    // Subscribe to events
    context.on('follow', (event) => {
      this.eventCount++;
      context.logger.info('New follower!', {
        username: event.user?.username,
        platform: event.platform
      });
    });

    // React to config changes
    context.onConfigChange((newConfig) => {
      context.logger.info('Config updated', { newConfig });
      this.restartInterval(context);
    });

    // Start periodic logging
    this.startInterval(context);
  },

  startInterval(context) {
    const interval = (context.config.logInterval || 60) * 1000;
    const greeting = context.config.greeting || 'Hello!';

    this.intervalId = setInterval(() => {
      context.logger.info(greeting, {
        eventCount: this.eventCount
      });
    }, interval);
  },

  restartInterval(context) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.startInterval(context);
    }
  },

  // Lifecycle: Stop
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Lifecycle: Shutdown
  async shutdown() {
    this.eventCount = 0;
  }
};
```

---

## Module Structure

### Required Fields

```typescript
interface ModuleInstance {
  // REQUIRED
  readonly name: string;        // Module identifier (lowercase, hyphenated)
  readonly version: string;     // Semantic version (e.g., "1.0.0")

  // OPTIONAL
  configSchema?: ModuleConfigSchema;
  initialize?(context: ModuleContext): Promise<void> | void;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
  shutdown?(): Promise<void> | void;
  routes?: ModuleRoute[];
  dashboardWidget?: DashboardWidget;
}
```

### Module Metadata (package.json)

For marketplace publication, create a `package.json`:

```json
{
  "name": "@gothbot/my-module",
  "version": "1.0.0",
  "description": "Description of what your module does",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "keywords": ["alerts", "overlay", "chat"],
  "gothbot": {
    "displayName": "My Module",
    "category": "overlay",
    "icon": "🎯",
    "configSchema": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "title": "Enable Feature",
          "default": true
        }
      }
    }
  }
}
```

---

## Module Context API

The `ModuleContext` is the primary interface for interacting with GothBot. It's passed to your `initialize()` hook.

### Identity Properties

```typescript
context.moduleId        // Your module's unique ID
context.moduleName      // Display name
context.version         // Module version
context.botVersion      // GothBot core version
context.connectedPlatforms  // ['twitch', 'kick', 'youtube']
```

### Event Handling

```typescript
// Subscribe to events
context.on(eventType: string, handler: Function): void
context.off(eventType: string, handler: Function): void

// Emit custom events
context.emit(eventType: string, data: any): Promise<void>
```

**Example:**
```javascript
const followHandler = async (event) => {
  context.logger.info('New follower', {
    username: event.user.username,
    platform: event.platform
  });
};

context.on('follow', followHandler);

// Later: unsubscribe
context.off('follow', followHandler);
```

### Storage API

Persistent, module-scoped key-value storage backed by PostgreSQL:

```typescript
// Get value
const value = await context.storage.get<T>(key: string): Promise<T | null>

// Set value (any JSON-serializable data)
await context.storage.set(key: string, value: any): Promise<void>

// Check existence
const exists = await context.storage.has(key: string): Promise<boolean>

// Delete
await context.storage.delete(key: string): Promise<void>

// List all keys
const allKeys = await context.storage.keys(): Promise<string[]>

// Clear all data
await context.storage.clear(): Promise<void>
```

**Example:**
```javascript
// Store alert count
const count = await context.storage.get('alertCount') || 0;
await context.storage.set('alertCount', count + 1);

// Store complex data
await context.storage.set('settings', {
  lastRun: Date.now(),
  users: ['alice', 'bob']
});

// Retrieve
const settings = await context.storage.get('settings');
```

### Logging

Module-attributed Winston logger:

```typescript
context.logger.info(message: string, meta?: object)
context.logger.warn(message: string, meta?: object)
context.logger.error(message: string, meta?: object)
context.logger.debug(message: string, meta?: object)
```

**Example:**
```javascript
context.logger.info('Processing alert', {
  alertType: 'follow',
  username: 'viewer123',
  platform: 'twitch'
});

context.logger.error('API request failed', {
  url: 'https://api.example.com',
  statusCode: 500,
  error: err.message
});
```

### Configuration

```typescript
// Get current config
const config = context.getConfig()

// Access directly
const setting = context.config.mySettingName

// React to changes
context.onConfigChange((newConfig) => {
  // Config was updated via admin panel
})
```

### OBS API Access

If OBS is connected:

```typescript
if (context.obsApi) {
  // Access OBS WebSocket API
  await context.obsApi.call('SetCurrentScene', { sceneName: 'Game' });
}
```

---

## Event System

### Available Event Types

#### Chat Events
```javascript
context.on('chat_message', (event) => {
  // event.message - Message text
  // event.user - User object
  // event.platform - 'twitch', 'kick', 'youtube'
});

context.on('chat_command', (event) => {
  // event.command - Command name
  // event.args - Command arguments
});
```

#### Follow/Subscribe Events
```javascript
context.on('follow', (event) => {
  // event.user.username
  // event.platform
});

context.on('subscribe', (event) => {
  // event.user.username
  // event.tier - Sub tier (1, 2, 3)
  // event.months - Total months subscribed
});

context.on('resubscribe', (event) => {
  // event.months
  // event.streak
  // event.message - Optional resub message
});

context.on('gift_subscription', (event) => {
  // event.gifter - User who gifted
  // event.recipient - User who received
  // event.tier
});
```

#### Engagement Events
```javascript
context.on('cheer', (event) => {
  // event.user.username
  // event.bits - Number of bits
  // event.message
});

context.on('tip', (event) => {
  // event.user.username
  // event.amount - Donation amount
  // event.currency - 'USD', etc.
  // event.message
});

context.on('raid', (event) => {
  // event.raider - Raiding channel
  // event.viewers - Viewer count
});

context.on('channel_point_redemption', (event) => {
  // event.reward.title
  // event.user.username
  // event.userInput
});
```

#### Stream Events
```javascript
context.on('stream_online', (event) => {
  // event.platform
  // event.title
  // event.game
});

context.on('stream_offline', (event) => {
  // event.platform
});

context.on('stream_update', (event) => {
  // event.title - New title
  // event.game - New game/category
});
```

#### Moderation Events
```javascript
context.on('ban', (event) => {
  // event.user - Banned user
  // event.moderator
  // event.reason
});

context.on('timeout', (event) => {
  // event.user
  // event.duration - Seconds
});
```

#### Special Events
```javascript
context.on('hype_train_begin', (event) => {
  // event.level
  // event.goal
});

context.on('poll_begin', (event) => {
  // event.title
  // event.choices
});

context.on('prediction_begin', (event) => {
  // event.title
  // event.outcomes
});
```

### Event Object Structure

All events conform to `NormalizedEvent`:

```typescript
interface NormalizedEvent {
  type: string;           // Event type
  platform: string;       // 'twitch', 'kick', 'youtube'
  timestamp: Date;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  // Event-specific fields...
}
```

---

## Storage API

### Best Practices

**Use namespaced keys:**
```javascript
// Good
await context.storage.set('alerts:queue', queue);
await context.storage.set('stats:totalAlerts', count);

// Avoid generic keys
await context.storage.set('queue', queue);  // Unclear
```

**Store structured data:**
```javascript
await context.storage.set('moduleState', {
  initialized: true,
  lastRun: Date.now(),
  counters: {
    follows: 10,
    subs: 5
  }
});
```

**Check before accessing:**
```javascript
if (await context.storage.has('settings')) {
  const settings = await context.storage.get('settings');
}
```

### Performance Considerations

- Storage operations are async (database calls)
- Batch reads when possible
- Cache frequently accessed data in module state
- Don't store large binary data (use external storage + URLs)

---

## Configuration Schema

Define module configuration using JSON Schema-like syntax:

### Schema Definition

```javascript
configSchema: {
  fieldName: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect',
    label: 'Display Label',
    description: 'Help text shown in UI',
    default: defaultValue,
    required: true | false,

    // For numbers
    min: 0,
    max: 100,

    // For select/multiselect
    options: [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' }
    ]
  }
}
```

### Full Example

```javascript
configSchema: {
  enabled: {
    type: 'boolean',
    label: 'Enable Alerts',
    description: 'Turn alerts on or off',
    default: true,
    required: true
  },
  duration: {
    type: 'number',
    label: 'Alert Duration (seconds)',
    description: 'How long each alert displays',
    default: 5,
    min: 2,
    max: 30,
    required: true
  },
  animationStyle: {
    type: 'select',
    label: 'Animation Style',
    description: 'Choose animation effect',
    default: 'slide',
    options: [
      { label: 'Slide In', value: 'slide' },
      { label: 'Fade', value: 'fade' },
      { label: 'Bounce', value: 'bounce' }
    ]
  },
  apiKey: {
    type: 'string',
    label: 'API Key',
    description: 'Your service API key',
    required: true
  },
  platforms: {
    type: 'multiselect',
    label: 'Enabled Platforms',
    default: ['twitch'],
    options: [
      { label: 'Twitch', value: 'twitch' },
      { label: 'Kick', value: 'kick' },
      { label: 'YouTube', value: 'youtube' }
    ]
  }
}
```

### Accessing Configuration

```javascript
async initialize(context) {
  // Access config values
  const duration = context.config.duration;
  const apiKey = context.config.apiKey;

  // React to changes
  context.onConfigChange((newConfig) => {
    console.log('Config updated:', newConfig);
    // Restart services, update state, etc.
  });
}
```

---

## Lifecycle Hooks

Modules can implement optional lifecycle hooks:

### 1. initialize(context)

**When:** Module is loaded into runtime
**Use for:** Setup, event subscriptions, initial data loading

```javascript
async initialize(context) {
  // Subscribe to events
  context.on('follow', this.handleFollow.bind(this));

  // Load state
  this.stats = await context.storage.get('stats') || { count: 0 };

  // Initialize services
  this.queue = [];

  context.logger.info('Module initialized');
}
```

### 2. start()

**When:** After all modules are initialized
**Use for:** Starting background services, timers

```javascript
async start() {
  // Start periodic tasks
  this.intervalId = setInterval(() => {
    this.processQueue();
  }, 1000);

  console.log('Module started');
}
```

### 3. stop()

**When:** Module is being disabled or reloaded
**Use for:** Stopping services, clearing timers

```javascript
async stop() {
  // Clear intervals
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }

  // Stop services
  await this.flushQueue();

  console.log('Module stopped');
}
```

### 4. shutdown()

**When:** Module is being uninstalled
**Use for:** Final cleanup, releasing resources

```javascript
async shutdown() {
  // Clear all state
  this.queue = [];
  this.stats = null;

  // Could optionally clear storage
  // await context.storage.clear();

  console.log('Module shut down');
}
```

### Lifecycle Flow

```
[Install] → initialize() → start() → [Running]
                ↓                        ↓
         [Reload/Disable]           [Disable]
                ↓                        ↓
             stop()                   stop()
                ↓                        ↓
         initialize()               [Stopped]
                ↓
            start()

[Uninstall] → stop() → shutdown() → [Removed]
```

---

## Security & Sandboxing

### Sandbox Environment

Modules run in isolated contexts with:

- **Memory limit:** 128MB (configurable)
- **Execution timeout:** 5 seconds per operation
- **No access to:**
  - `require()` / `import()`
  - `process` object
  - `fs` (file system)
  - `child_process`
  - Node.js core modules
  - Global scope pollution

### Allowed APIs

- `console.*` (redirected to module logger)
- `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`
- `Date`, `Math`, `JSON`, `Array`, `Object`, `Promise`
- Module Context API (provided via parameter)

### Best Practices

**Do:**
- Use `context.storage` for data persistence
- Use `context.logger` for logging
- Handle errors gracefully with try/catch
- Respect resource limits
- Clean up timers and listeners in `stop()`

**Don't:**
- Attempt to access filesystem
- Try to execute external processes
- Store sensitive data in plain text
- Create memory leaks with unreleased references
- Block event loop with synchronous operations

### Security Example

```javascript
async initialize(context) {
  try {
    // Good: Using provided APIs
    await context.storage.set('key', 'value');
    context.logger.info('Data stored');

    // Bad: These will fail in sandbox
    // const fs = require('fs');  // ❌ Not available
    // process.exit(1);           // ❌ No access

  } catch (error) {
    // Always handle errors
    context.logger.error('Initialization failed', {
      error: error.message
    });
  }
}
```

---

## Testing Your Module

### Local Testing

1. **Bundle your module:**
```bash
# Simple bundling (all in one file)
cat module.js > bundle.js

# Or use esbuild for more complex modules
npx esbuild module.js --bundle --format=esm --outfile=bundle.js
```

2. **Install via SQL (testing only):**
```sql
INSERT INTO "InstalledModule" (
  id, "moduleId", name, version, enabled, code, config, metadata
) VALUES (
  gen_random_uuid(),
  'test-module',
  'Test Module',
  '1.0.0',
  true,
  '/* your bundled code here */',
  '{}'::jsonb,
  '{"author": "Your Name", "description": "Test"}'::jsonb
);
```

3. **Monitor logs:**
```bash
# Docker
docker logs gothbot-app-1 -f | grep "test-module"

# PM2
pm2 logs gothbot | grep "test-module"
```

4. **Test functionality:**
- Trigger events (follow, chat, etc.)
- Update config via API: `PUT /api/modules/test-module/config`
- Test reload: `PUT /api/modules/test-module/reload`
- Check storage: `SELECT * FROM "ModuleData" WHERE "moduleId" = 'test-module'`

### Test Checklist

- [ ] Module loads without errors
- [ ] All event handlers trigger correctly
- [ ] Storage persists across reloads
- [ ] Configuration updates are detected
- [ ] Cleanup happens properly on disable
- [ ] No memory leaks after multiple reload cycles
- [ ] Logs are clear and helpful
- [ ] Error cases are handled gracefully

---

## Publishing to Marketplace

### Preparation

1. **Create complete module bundle:**
```javascript
// index.js
export default {
  name: 'my-module',
  version: '1.0.0',
  // ... complete implementation
};
```

2. **Create package.json with metadata:**
```json
{
  "name": "@gothbot/my-module",
  "version": "1.0.0",
  "description": "What your module does",
  "author": "Your Name",
  "license": "MIT",
  "gothbot": {
    "displayName": "My Module",
    "category": "overlay",
    "icon": "🎯"
  }
}
```

3. **Write documentation (README.md):**
- Features overview
- Installation instructions
- Configuration guide
- Usage examples
- Troubleshooting

### Submission Process

1. **Host your module:**
   - GitHub repository with releases
   - Or submit for bundled inclusion in GothBot core

2. **Create catalog entry:**
```json
{
  "id": "my-module",
  "name": "My Module",
  "version": "1.0.0",
  "description": "Brief description",
  "author": "Your Name",
  "category": "overlay",
  "tags": ["alerts", "overlay"],
  "icon": "🎯",
  "downloadUrl": "https://github.com/you/module/releases/download/v1.0.0/bundle.js",
  "installType": "npm",
  "features": [
    "Feature 1",
    "Feature 2"
  ],
  "requirements": {
    "botVersion": ">=2.0.116",
    "moduleFramework": ">=1.0.0"
  },
  "documentation": "https://github.com/you/module/blob/main/README.md",
  "repository": "https://github.com/you/module",
  "license": "MIT",
  "verified": false,
  "official": false
}
```

3. **Submit Pull Request:**
   - Fork [gothbot-modules](https://github.com/GothUncc/gothbot-modules)
   - Add your entry to `catalog.json`
   - Update `README.md` with your module
   - Submit PR with description

4. **Review Process:**
   - Code review for security
   - Functionality testing
   - Documentation review
   - Approval and merge

### Categories

- **overlay** - Visual overlays for OBS/stream
- **integration** - Third-party service integrations
- **chat** - Chat commands and interactions
- **automation** - Automated tasks and workflows
- **analytics** - Stats, tracking, and reporting
- **utility** - Helper tools and utilities

---

## Best Practices

### Code Organization

```javascript
export default {
  name: 'my-module',
  version: '1.0.0',

  // Group related functionality
  state: {
    queue: [],
    processing: false,
    stats: null
  },

  configSchema: { /* ... */ },

  async initialize(context) {
    await this.loadState(context);
    this.setupEventHandlers(context);
    this.startBackgroundTasks(context);
  },

  // Helper methods
  async loadState(context) {
    this.state.stats = await context.storage.get('stats') || {};
  },

  setupEventHandlers(context) {
    context.on('follow', this.handleFollow.bind(this));
    context.on('subscribe', this.handleSubscribe.bind(this));
  },

  startBackgroundTasks(context) {
    // ...
  },

  // Event handlers
  async handleFollow(event) {
    // ...
  },

  async handleSubscribe(event) {
    // ...
  }
};
```

### Error Handling

```javascript
async initialize(context) {
  try {
    await this.setupDatabase(context);
  } catch (error) {
    context.logger.error('Database setup failed', {
      error: error.message,
      stack: error.stack
    });
    throw error; // Prevent module from loading if critical
  }

  // Non-critical errors
  try {
    await this.fetchExternalData();
  } catch (error) {
    context.logger.warn('External data unavailable, using defaults', {
      error: error.message
    });
    // Continue loading with fallback
  }
}
```

### Performance

```javascript
// Cache frequently accessed config
async initialize(context) {
  this.cachedConfig = { ...context.config };

  context.onConfigChange((newConfig) => {
    this.cachedConfig = { ...newConfig };
  });
}

// Debounce expensive operations
async handleChatMessage(event) {
  if (this.processingTimeout) {
    clearTimeout(this.processingTimeout);
  }

  this.processingTimeout = setTimeout(() => {
    this.processBatch();
  }, 1000);
}

// Batch database operations
async saveMultipleItems(items) {
  const batch = items.map(item =>
    context.storage.set(`item:${item.id}`, item)
  );
  await Promise.all(batch);
}
```

### Logging

```javascript
// Use appropriate log levels
context.logger.debug('Detailed debugging info');  // Development
context.logger.info('Normal operation');          // General info
context.logger.warn('Non-critical issue');        // Warning
context.logger.error('Error occurred');           // Error

// Include context
context.logger.info('Processing alert', {
  alertType: 'follow',
  username: event.user.username,
  platform: event.platform,
  queueSize: this.queue.length
});
```

---

## Examples

### Example 1: Simple Event Counter

```javascript
export default {
  name: 'event-counter',
  version: '1.0.0',

  counts: {},

  async initialize(context) {
    // Load previous counts
    this.counts = await context.storage.get('counts') || {};

    // Count all events
    const eventTypes = ['follow', 'subscribe', 'cheer', 'raid'];

    eventTypes.forEach(type => {
      context.on(type, async () => {
        this.counts[type] = (this.counts[type] || 0) + 1;
        await context.storage.set('counts', this.counts);

        context.logger.info(`${type} count: ${this.counts[type]}`);
      });
    });
  }
};
```

### Example 2: Alert Queue System

```javascript
export default {
  name: 'alert-queue',
  version: '1.0.0',

  configSchema: {
    alertDuration: {
      type: 'number',
      label: 'Alert Duration (seconds)',
      default: 5,
      min: 2,
      max: 30
    }
  },

  queue: [],
  processing: false,

  async initialize(context) {
    context.on('follow', (event) => this.queueAlert({
      type: 'follow',
      username: event.user.username,
      platform: event.platform
    }));

    context.on('subscribe', (event) => this.queueAlert({
      type: 'subscribe',
      username: event.user.username,
      tier: event.tier
    }));

    setInterval(() => this.processQueue(context), 1000);
  },

  queueAlert(alert) {
    this.queue.push({
      ...alert,
      timestamp: Date.now()
    });
  },

  async processQueue(context) {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const alert = this.queue.shift();

    context.logger.info('Displaying alert', alert);

    // Show alert for configured duration
    const duration = context.config.alertDuration * 1000;
    await new Promise(resolve => setTimeout(resolve, duration));

    this.processing = false;
  },

  stop() {
    this.processing = false;
    this.queue = [];
  }
};
```

### Example 3: API Integration Module

```javascript
export default {
  name: 'third-party-integration',
  version: '1.0.0',

  configSchema: {
    apiKey: {
      type: 'string',
      label: 'API Key',
      required: true
    },
    webhookUrl: {
      type: 'string',
      label: 'Webhook URL',
      required: true
    }
  },

  async initialize(context) {
    if (!context.config.apiKey) {
      throw new Error('API Key is required');
    }

    context.on('follow', async (event) => {
      await this.sendWebhook(context, {
        event: 'follow',
        user: event.user.username,
        platform: event.platform,
        timestamp: event.timestamp
      });
    });
  },

  async sendWebhook(context, data) {
    try {
      const response = await fetch(context.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.config.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      context.logger.info('Webhook sent successfully');

    } catch (error) {
      context.logger.error('Webhook failed', {
        error: error.message,
        url: context.config.webhookUrl
      });
    }
  }
};
```

---

## Additional Resources

- **Main Documentation:** [MODULE_SYSTEM.md](https://github.com/GothUncc/gothomationbotV2/blob/main/MODULE_SYSTEM.md)
- **Type Definitions:** [src/core/modules/types.ts](https://github.com/GothUncc/gothomationbotV2/blob/main/src/core/modules/types.ts)
- **Example Module:** [test-modules/hello-world](https://github.com/GothUncc/gothomationbotV2/tree/main/test-modules/hello-world)
- **Official Alert Module:** [modules/alerts](https://github.com/GothUncc/gothomationbotV2/tree/main/modules/alerts)
- **Module Marketplace:** [gothbot-modules](https://github.com/GothUncc/gothbot-modules)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/GothUncc/gothomationbotV2/issues)
- **Documentation:** [GothBot Docs](https://github.com/GothUncc/gothomationbotV2)
- **Discord:** Coming soon

---

**Happy Module Building! 🎯**

Built with ❤️ by the GothBot Team
