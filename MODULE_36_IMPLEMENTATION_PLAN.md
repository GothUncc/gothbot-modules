# Module #36 Implementation Plan: OBS Control & Dynamic Overlay System

## Executive Summary

Transform existing OBS integration into a **loadable module** that provides dynamic overlay and source management capabilities to other modules. This module will be the foundation for all overlay-based features.

## Current State Analysis

### ✅ What You Already Have

**Existing OBS Infrastructure:**
- `src/integrations/obs/OBSWebSocketClient.ts` - WebSocket client with reconnection
- `src/integrations/obs-core/OBSMasterCore.ts` - Core OBS operations
- `src/integrations/obs-core/OBSControlLayer.ts` - Control abstraction
- `obs-websocket-js` v5.0.6 installed
- Connection management, scene switching, source creation
- Media playback system
- State validation and error recovery

### 🔧 What Needs To Be Built

**Module-Specific Components:**
1. **Module wrapper** - Adapt existing code to module framework
2. **Dynamic alert engine** - Create/destroy sources on-demand
3. **Event-driven automation** - React to platform events
4. **Module Context API exposure** - Make OBS available to other modules
5. **Admin UI integration** - Management dashboard

---

## Architecture Design

### Module Structure

```
modules/obs-control/
├── index.js                 # Module entry point (ES module)
├── package.json             # Module metadata
├── README.md               # Documentation
├── src/
│   ├── OBSModuleCore.js    # Main module logic
│   ├── DynamicAlertEngine.js   # Alert creation/destruction
│   ├── AutomationEngine.js     # Event-driven automation
│   ├── SourceManager.js        # Dynamic source lifecycle
│   └── types.js                # Type definitions
└── test/
    └── obs-control.test.js
```

### Integration with Existing Code

**Option 1: Wrap Existing Services (Recommended)**
```javascript
// Module uses existing OBSMasterCore as a service
import { OBSMasterCore } from '../../../src/integrations/obs-core/OBSMasterCore.js';

export default {
  name: 'obs-control',
  version: '1.0.0',

  obsCore: null,

  async initialize(context) {
    // Initialize existing OBS core
    this.obsCore = await initializeOBSCore(context.config);

    // Add module-specific enhancements
    this.alertEngine = new DynamicAlertEngine(this.obsCore, context);
    this.automationEngine = new AutomationEngine(this.obsCore, context);
  }
};
```

**Option 2: Refactor into Module (More Work)**
- Move OBS code from `src/integrations/` into `modules/obs-control/`
- Convert to module framework
- More isolated but requires more refactoring

**Recommendation: Use Option 1** - Less disruption, faster implementation

---

## Implementation Phases

## Phase 1: Module Scaffolding (Week 1)

### Goals
- Create module structure
- Integrate with existing OBS code
- Basic connection management
- Module lifecycle hooks

### Tasks

**1.1 Create Module Files**
```bash
mkdir -p modules/obs-control/src
cd modules/obs-control
```

**1.2 package.json**
```json
{
  "name": "@gothbot/obs-control",
  "version": "1.0.0",
  "description": "Dynamic OBS WebSocket control and overlay management",
  "main": "index.js",
  "author": "GothBot Team",
  "license": "MIT",
  "gothbot": {
    "displayName": "OBS Control",
    "category": "infrastructure",
    "icon": "🎥",
    "configSchema": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string",
          "title": "OBS WebSocket Host",
          "default": "localhost"
        },
        "port": {
          "type": "number",
          "title": "OBS WebSocket Port",
          "default": 4455
        },
        "password": {
          "type": "string",
          "title": "OBS WebSocket Password",
          "description": "Leave blank if no password set"
        },
        "autoReconnect": {
          "type": "boolean",
          "title": "Auto Reconnect",
          "default": true
        },
        "reconnectDelay": {
          "type": "number",
          "title": "Reconnect Delay (ms)",
          "default": 5000,
          "minimum": 1000,
          "maximum": 30000
        }
      }
    }
  }
}
```

**1.3 index.js (Module Entry Point)**
```javascript
/**
 * OBS Control Module
 * Provides dynamic OBS source management and event-driven automation
 */

import { initializeOBSServices } from './src/OBSModuleCore.js';
import { DynamicAlertEngine } from './src/DynamicAlertEngine.js';
import { AutomationEngine } from './src/AutomationEngine.js';

export default {
  name: 'obs-control',
  version: '1.0.0',

  // Module state
  obsServices: null,
  alertEngine: null,
  automationEngine: null,
  isConnected: false,

  configSchema: {
    host: {
      type: 'string',
      label: 'OBS WebSocket Host',
      default: 'localhost'
    },
    port: {
      type: 'number',
      label: 'OBS WebSocket Port',
      default: 4455,
      min: 1,
      max: 65535
    },
    password: {
      type: 'string',
      label: 'OBS WebSocket Password',
      description: 'Leave blank if no password'
    },
    autoReconnect: {
      type: 'boolean',
      label: 'Auto Reconnect',
      default: true
    }
  },

  /**
   * Initialize module
   */
  async initialize(context) {
    context.logger.info('OBS Control module initializing');

    try {
      // Initialize OBS services using existing infrastructure
      this.obsServices = await initializeOBSServices({
        host: context.config.host || 'localhost',
        port: context.config.port || 4455,
        password: context.config.password,
        autoReconnect: context.config.autoReconnect !== false,
        logger: context.logger
      });

      // Setup components
      this.alertEngine = new DynamicAlertEngine(this.obsServices, context);
      this.automationEngine = new AutomationEngine(this.obsServices, context);

      // Connection event handlers
      this.obsServices.on('connected', () => {
        this.isConnected = true;
        context.logger.info('Connected to OBS');
        context.emit('obs:connected');
      });

      this.obsServices.on('disconnected', () => {
        this.isConnected = false;
        context.logger.warn('Disconnected from OBS');
        context.emit('obs:disconnected');
      });

      this.obsServices.on('error', (error) => {
        context.logger.error('OBS error', { error: error.message });
        context.emit('obs:error', error);
      });

      // Setup event-driven automation
      this.setupAutomation(context);

      // Store API in context for other modules
      context.obsApi = this.getPublicAPI();

      context.logger.info('OBS Control module initialized successfully');

    } catch (error) {
      context.logger.error('Failed to initialize OBS Control', {
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Start module services
   */
  async start() {
    if (this.obsServices) {
      await this.obsServices.connect();
    }
  },

  /**
   * Stop module services
   */
  async stop() {
    if (this.automationEngine) {
      await this.automationEngine.cleanup();
    }

    if (this.alertEngine) {
      await this.alertEngine.cleanup();
    }
  },

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    if (this.obsServices) {
      await this.obsServices.disconnect();
    }

    this.obsServices = null;
    this.alertEngine = null;
    this.automationEngine = null;
  },

  /**
   * Setup event-driven automation
   */
  setupAutomation(context) {
    // Example: Flash screen on subscription
    context.on('subscribe', async (event) => {
      if (this.isConnected) {
        await this.automationEngine.executeAction({
          type: 'flash_filter',
          source: 'Webcam',
          color: '#FF0000',
          duration: 500
        });
      }
    });

    // Other modules can register their own automations
    // via context.obsApi.registerAutomation()
  },

  /**
   * Get public API for other modules
   */
  getPublicAPI() {
    return {
      // Connection status
      isConnected: () => this.isConnected,

      // Scene management
      getScenes: () => this.obsServices.getSceneList(),
      getCurrentScene: () => this.obsServices.getCurrentScene(),
      setScene: (sceneName) => this.obsServices.setScene(sceneName),

      // Dynamic source management
      createSource: (config) => this.alertEngine.createDynamicSource(config),
      removeSource: (sourceId) => this.alertEngine.removeDynamicSource(sourceId),
      updateSource: (sourceId, updates) => this.alertEngine.updateSource(sourceId, updates),

      // Alert system
      showAlert: (alertConfig) => this.alertEngine.showAlert(alertConfig),
      hideAlert: (alertId) => this.alertEngine.hideAlert(alertId),

      // Automation
      registerAutomation: (rule) => this.automationEngine.registerRule(rule),
      executeAction: (action) => this.automationEngine.executeAction(action),

      // Statistics
      getStats: () => this.obsServices.getSystemStats(),
      getStreamingStats: () => this.obsServices.getStreamingStats(),
      getRecordingStats: () => this.obsServices.getRecordingStats()
    };
  }
};
```

**1.4 Test Installation**
```sql
-- Insert into database for testing
INSERT INTO "InstalledModule" (
  id, "moduleId", name, version, enabled, code, config, metadata
) VALUES (
  gen_random_uuid(),
  'obs-control',
  'OBS Control',
  '1.0.0',
  true,
  '/* bundled code here */',
  '{"host": "localhost", "port": 4455}'::jsonb,
  '{"author": "GothBot Team", "category": "infrastructure"}'::jsonb
);
```

**Deliverables:**
- ✅ Module loads successfully
- ✅ Connects to OBS
- ✅ Basic lifecycle hooks working
- ✅ Configuration from module config

---

## Phase 2: Dynamic Alert Engine (Week 2)

### Goals
- Create/destroy alert sources dynamically
- Queue management
- Alert display lifecycle

### Tasks

**2.1 DynamicAlertEngine.js**
```javascript
export class DynamicAlertEngine {
  constructor(obsServices, context) {
    this.obsServices = obsServices;
    this.context = context;
    this.activeAlerts = new Map();
    this.alertQueue = [];
    this.processing = false;
  }

  /**
   * Show an alert dynamically
   */
  async showAlert(config) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert = {
      id: alertId,
      type: config.type, // 'follow', 'subscribe', etc.
      sourceName: `DynamicAlert_${alertId}`,
      scene: config.scene || await this.obsServices.getCurrentScene(),
      duration: config.duration || 5000,
      config
    };

    this.alertQueue.push(alert);

    if (!this.processing) {
      this.processQueue();
    }

    return alertId;
  }

  /**
   * Process alert queue
   */
  async processQueue() {
    if (this.processing || this.alertQueue.length === 0) {
      return;
    }

    this.processing = true;
    const alert = this.alertQueue.shift();

    try {
      // 1. Create browser source for alert
      await this.obsServices.createSource(
        alert.scene,
        alert.sourceName,
        'browser_source',
        {
          url: `http://localhost:3000/overlay/alert?type=${alert.type}&id=${alert.id}`,
          width: 1920,
          height: 1080,
          fps: 60,
          shutdown: true // Shutdown source when not visible
        }
      );

      // 2. Show the source
      await this.obsServices.showSource(alert.scene, alert.sourceName);

      // 3. Store active alert
      this.activeAlerts.set(alert.id, alert);

      this.context.logger.info('Alert displayed', {
        id: alert.id,
        type: alert.type
      });

      // 4. Wait for duration
      await new Promise(resolve => setTimeout(resolve, alert.duration));

      // 5. Remove alert
      await this.removeAlert(alert.id);

    } catch (error) {
      this.context.logger.error('Alert display failed', {
        error: error.message,
        alert: alert.id
      });
    } finally {
      this.processing = false;

      // Process next alert
      if (this.alertQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Remove an alert
   */
  async removeAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    try {
      // Hide source
      await this.obsServices.hideSource(alert.scene, alert.sourceName);

      // Remove source from OBS
      await this.obsServices.removeSource(alert.scene, alert.sourceName);

      this.activeAlerts.delete(alertId);

      this.context.logger.info('Alert removed', { id: alertId });
    } catch (error) {
      this.context.logger.error('Alert removal failed', {
        error: error.message,
        alert: alertId
      });
    }
  }

  /**
   * Cleanup all alerts
   */
  async cleanup() {
    for (const [alertId] of this.activeAlerts) {
      await this.removeAlert(alertId);
    }

    this.alertQueue = [];
    this.processing = false;
  }
}
```

**2.2 Create Alert Overlay Endpoint**
```javascript
// In src/api/routes/overlay.ts
router.get('/overlay/alert', (req, res) => {
  const { type, id } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: transparent; overflow: hidden; }
        .alert { /* alert styling */ }
      </style>
    </head>
    <body>
      <div class="alert" data-type="${type}" data-id="${id}">
        <!-- Alert content -->
      </div>
      <script>
        // Alert animation logic
      </script>
    </body>
    </html>
  `);
});
```

**Deliverables:**
- ✅ Dynamic alert creation
- ✅ Alert queue management
- ✅ Auto-cleanup after duration
- ✅ No leftover sources in OBS

---

## Phase 3: Automation Engine (Week 3)

### Goals
- Event-driven OBS actions
- Configurable automation rules
- Multi-step sequences

### Tasks

**3.1 AutomationEngine.js**
```javascript
export class AutomationEngine {
  constructor(obsServices, context) {
    this.obsServices = obsServices;
    this.context = context;
    this.rules = new Map();
  }

  /**
   * Register automation rule
   */
  registerRule(rule) {
    const ruleId = rule.id || `rule_${Date.now()}`;

    this.rules.set(ruleId, rule);

    // Subscribe to event
    this.context.on(rule.eventType, async (event) => {
      await this.executeRule(ruleId, event);
    });

    return ruleId;
  }

  /**
   * Execute automation rule
   */
  async executeRule(ruleId, event) {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    // Check conditions
    if (rule.conditions && !this.evaluateConditions(rule.conditions, event)) {
      return;
    }

    // Execute actions
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, event);
      } catch (error) {
        this.context.logger.error('Automation action failed', {
          rule: ruleId,
          action: action.type,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute single action
   */
  async executeAction(action, event) {
    switch (action.type) {
      case 'switch_scene':
        await this.obsServices.setScene(action.sceneName);
        break;

      case 'flash_filter':
        // Apply color flash filter temporarily
        // Implementation depends on OBS filter API
        break;

      case 'show_source':
        await this.obsServices.showSource(action.scene, action.source);
        break;

      case 'hide_source':
        await this.obsServices.hideSource(action.scene, action.source);
        break;

      case 'delay':
        await new Promise(resolve => setTimeout(resolve, action.duration));
        break;

      default:
        this.context.logger.warn('Unknown action type', { type: action.type });
    }
  }

  /**
   * Evaluate rule conditions
   */
  evaluateConditions(conditions, event) {
    // Simple condition evaluation
    // Can be expanded for complex logic
    return true;
  }

  /**
   * Cleanup
   */
  async cleanup() {
    this.rules.clear();
  }
}
```

**3.2 Example Automation Rules**
```javascript
// In module initialization
automationEngine.registerRule({
  id: 'raid_scene_switch',
  eventType: 'raid',
  conditions: {
    minViewers: 100
  },
  actions: [
    { type: 'switch_scene', sceneName: 'Raid Celebration' },
    { type: 'delay', duration: 10000 },
    { type: 'switch_scene', sceneName: 'Main' }
  ]
});
```

**Deliverables:**
- ✅ Rule registration system
- ✅ Event-driven action execution
- ✅ Multi-step sequences
- ✅ Condition evaluation

---

## Phase 4: Module Context API (Week 4)

### Goals
- Expose OBS API to other modules via context
- Safe API surface
- Documentation

### Tasks

**4.1 Public API Definition**
```typescript
// types.ts
export interface OBSModuleAPI {
  // Connection
  isConnected(): boolean;

  // Scenes
  getScenes(): Promise<string[]>;
  getCurrentScene(): Promise<string>;
  setScene(sceneName: string): Promise<void>;

  // Sources
  createSource(config: SourceConfig): Promise<string>;
  removeSource(sourceId: string): Promise<void>;
  updateSource(sourceId: string, updates: any): Promise<void>;
  showSource(scene: string, source: string): Promise<void>;
  hideSource(scene: string, source: string): Promise<void>;

  // Alerts
  showAlert(config: AlertConfig): Promise<string>;

  // Automation
  registerAutomation(rule: AutomationRule): string;

  // Stats
  getStats(): Promise<OBSStats>;
}
```

**4.2 Usage Example (From Other Module)**
```javascript
// In another module (e.g., enhanced alerts)
export default {
  name: 'enhanced-alerts',

  async initialize(context) {
    // Check if OBS Control is available
    if (!context.obsApi) {
      context.logger.warn('OBS Control module not available');
      return;
    }

    // Use OBS API
    context.on('follow', async (event) => {
      if (context.obsApi.isConnected()) {
        await context.obsApi.showAlert({
          type: 'follow',
          username: event.user.username,
          duration: 5000
        });
      }
    });
  }
};
```

**Deliverables:**
- ✅ Public API exposed via context.obsApi
- ✅ Type definitions
- ✅ Usage documentation
- ✅ Error handling

---

## Phase 5: Admin UI (Week 5-6)

### Goals
- OBS connection management UI
- Automation rule builder
- Alert testing interface
- Real-time status monitoring

### Tasks

**5.1 Admin Dashboard Routes**
```javascript
// frontend/src/routes/modules/obs-control/+page.svelte
<script>
  import { onMount } from 'svelte';

  let connectionStatus = 'disconnected';
  let scenes = [];
  let currentScene = '';

  onMount(async () => {
    // Fetch OBS status
    const response = await fetch('/api/modules/obs-control/status');
    const data = await response.json();

    connectionStatus = data.connected ? 'connected' : 'disconnected';
    if (data.connected) {
      scenes = data.scenes;
      currentScene = data.currentScene;
    }
  });
</script>

<div class="obs-dashboard">
  <h1>OBS Control</h1>

  <div class="connection-status">
    <span class:connected={connectionStatus === 'connected'}>
      {connectionStatus}
    </span>
  </div>

  <div class="scene-switcher">
    <h2>Scenes</h2>
    {#each scenes as scene}
      <button
        class:active={scene === currentScene}
        on:click={() => switchScene(scene)}
      >
        {scene}
      </button>
    {/each}
  </div>

  <div class="alert-tester">
    <h2>Test Alerts</h2>
    <button on:click={() => testAlert('follow')}>
      Test Follow Alert
    </button>
    <button on:click={() => testAlert('subscribe')}>
      Test Subscribe Alert
    </button>
  </div>
</div>
```

**5.2 API Routes**
```javascript
// modules/obs-control/routes/status.js
export async function GET(context) {
  const obsApi = context.obsApi;

  return {
    connected: obsApi.isConnected(),
    scenes: obsApi.isConnected() ? await obsApi.getScenes() : [],
    currentScene: obsApi.isConnected() ? await obsApi.getCurrentScene() : null,
    stats: obsApi.isConnected() ? await obsApi.getStats() : null
  };
}
```

**Deliverables:**
- ✅ Connection status UI
- ✅ Scene switcher
- ✅ Alert testing
- ✅ Live stats display

---

## Testing Strategy

### Unit Tests
```javascript
// test/obs-control.test.js
describe('OBS Control Module', () => {
  it('should initialize successfully', async () => {
    const module = await loadModule('obs-control');
    await module.initialize(mockContext);
    expect(module.isConnected).toBe(true);
  });

  it('should create dynamic alert', async () => {
    const alertId = await module.showAlert({
      type: 'follow',
      duration: 1000
    });
    expect(alertId).toBeDefined();
  });

  it('should cleanup alerts on shutdown', async () => {
    await module.shutdown();
    expect(module.alertEngine.activeAlerts.size).toBe(0);
  });
});
```

### Integration Tests
- Test with real OBS instance
- Verify source creation/deletion
- Test automation rules
- Verify no memory leaks

### Manual Testing Checklist
- [ ] Module loads successfully
- [ ] Connects to OBS
- [ ] Creates alert sources
- [ ] Removes sources after duration
- [ ] Handles OBS disconnect gracefully
- [ ] Admin UI displays correctly
- [ ] Alert queue works properly
- [ ] Automation rules trigger correctly

---

## Deployment & Migration

### Installation
```bash
# Bundle module
npm run build:module obs-control

# Install via API
POST /api/modules/install
{
  "moduleId": "obs-control",
  "version": "1.0.0",
  "autoEnable": true
}
```

### Migration from Old Alert System

**Step 1: Install OBS Control Module**
```bash
# Module automatically available after installation
```

**Step 2: Update Alert System to use OBS Control**
```javascript
// In modules/alerts/index.js
async initialize(context) {
  // Use OBS Control instead of direct OBS access
  if (context.obsApi) {
    this.useOBSControl(context.obsApi);
  }
}
```

**Step 3: Deprecate Old Implementation**
- Mark old alert system as deprecated
- Update documentation
- Provide migration guide

---

## Success Metrics

### Performance
- Alert display latency < 500ms
- No memory leaks after 1000 alerts
- OBS source count returns to baseline after alerts

### Reliability
- 99.9% uptime with OBS running
- Graceful degradation when OBS offline
- Auto-reconnect within 5 seconds

### Usability
- Alert testing from UI works
- Clear error messages
- Documentation complete

---

## Risk Mitigation

### Risk: OBS WebSocket Changes
**Mitigation:** Abstract WebSocket calls, version checking

### Risk: Performance Impact
**Mitigation:** Source pooling, rate limiting, benchmarking

### Risk: Module Conflicts
**Mitigation:** Namespace sources, cleanup on unload

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| Phase 1 | Week 1 | Module scaffolding & connection |
| Phase 2 | Week 2 | Dynamic alert engine |
| Phase 3 | Week 3 | Automation engine |
| Phase 4 | Week 4 | Module Context API |
| Phase 5 | Weeks 5-6 | Admin UI |
| **Total** | **6 weeks** | **Production-ready module** |

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Set up development environment** - OBS with WebSocket enabled
3. **Start Phase 1** - Module scaffolding
4. **Incremental testing** - Test each phase thoroughly
5. **Documentation** - Keep README updated

## Questions to Resolve

1. Should OBS Control be a **required** module or optional?
2. How should other modules declare OBS Control as a dependency?
3. Should we support multiple OBS instances?
4. What's the migration timeline for existing alert users?

---

**Ready to start Phase 1?**
