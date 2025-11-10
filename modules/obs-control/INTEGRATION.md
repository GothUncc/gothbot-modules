# OBS Control Module - Integration Guide

## For Main Bot Developers

This document explains how to integrate the OBS Control module with the main GothBot codebase.

### Integration Point

The OBS Control module expects an OBS service to be injected via the module context. This allows the module to use the bot's existing OBS WebSocket connection instead of creating its own.

### How to Inject OBS Service

In the main bot's module system (`src/core/modules/ModuleContext.ts`), add the OBS service to the context:

```typescript
// In ModuleContext constructor or initialization
class ModuleContext {
  constructor(moduleId: string, config: any) {
    // ... existing code ...
    
    // Inject services that modules can use
    this.services = {
      obs: getOBSMasterCore(), // Your existing OBS service instance
      // ... other services ...
    };
  }
}
```

### Required OBS Service Interface

The OBS Control module expects the injected service to implement these methods:

```typescript
interface OBSService {
  // Connection
  isConnected(): boolean;
  on(event: string, handler: Function): void;
  
  // Scenes
  getSceneList(): Promise<string[]>;
  getCurrentProgramScene(): Promise<string>;
  setCurrentProgramScene(sceneName: string): Promise<void>;
  
  // Sources
  createBrowserSource(scene: string, source: string, settings: any): Promise<void>;
  removeSceneItem(scene: string, source: string): Promise<void>;
  setSceneItemEnabled(scene: string, source: string, enabled: boolean): Promise<void>;
  getSceneItemEnabled(scene: string, source: string): Promise<boolean>;
  
  // Media
  triggerMediaInputAction(source: string, action: string): Promise<void>;
  
  // Streaming/Recording
  startStream(): Promise<void>;
  stopStream(): Promise<void>;
  startRecord(): Promise<void>;
  stopRecord(): Promise<void>;
  
  // Stats
  getStats(): Promise<any>;
  getStreamStatus(): Promise<any>;
  getRecordStatus(): Promise<any>;
}
```

### Example Integration in GothBot Main Repo

**File: `src/core/modules/ModuleContext.ts`**

```typescript
import { OBSMasterCore } from '../integrations/obs-core/OBSMasterCore';

export class ModuleContext {
  public services: {
    obs?: OBSMasterCore;
  };

  constructor(
    public moduleId: string,
    private config: any,
    private logger: Logger,
    private container: ServiceContainer
  ) {
    // Inject OBS service if available
    this.services = {
      obs: container.get<OBSMasterCore>('OBSMasterCore')
    };
  }
}
```

### Fallback Behavior

If no OBS service is injected, the module will:
1. Log a warning: "No OBS service provided by bot - running in standalone mode"
2. Return default values for all operations
3. Log warnings when OBS operations are attempted
4. Continue to function (other features still work)

This allows the module to be installed and enabled even if OBS integration isn't ready yet.

### Testing the Integration

1. **Install the module** from the marketplace
2. **Enable the module** in the bot admin panel
3. **Check the logs** for:
   ```
   [obs-control] Using bot OBS service
   [obs-control] OBS connected via bot service
   [obs-control] OBS Control module initialized successfully
   ```

4. **Test from another module**:
   ```javascript
   async initialize(context) {
     if (context.obsApi) {
       const connected = context.obsApi.isConnected();
       console.log('OBS connected:', connected);
       
       const scenes = await context.obsApi.getScenes();
       console.log('Available scenes:', scenes);
     }
   }
   ```

### Migration Path

**Phase 1: Without Integration (Current)**
- Module installs and loads
- Logs warnings about standalone mode
- Provides API interface (returns defaults)

**Phase 2: With Integration (After main bot update)**
- Inject OBS service via `context.services.obs`
- Module uses bot's OBS connection
- Full functionality available

### Required Main Bot Changes

**File: `src/core/modules/ModuleRuntime.ts`**

```typescript
async loadModule(module: InstalledModule) {
  // ... existing module loading code ...
  
  const context = new ModuleContext(
    module.moduleId,
    module.config,
    logger,
    this.serviceContainer // Pass service container
  );
  
  await moduleInstance.initialize(context);
}
```

**File: `src/core/ServiceContainer.ts` (or wherever services are managed)**

```typescript
// Register OBS service
container.register('OBSMasterCore', () => {
  return obsMasterCoreInstance; // Your existing OBS instance
});
```

### Events

The module will forward OBS events:
- `obs:connected` - OBS WebSocket connected
- `obs:disconnected` - OBS WebSocket disconnected  
- `obs:error` - OBS error occurred

Other modules can listen:
```javascript
context.on('obs:connected', () => {
  console.log('OBS is ready!');
});
```

## Summary

**What the module needs from the main bot:**
- OBS service injected via `context.services.obs`
- Service must implement the interface above
- Events: `connected`, `disconnected`, `error`

**What the module provides:**
- `context.obsApi` - Public API for other modules
- Dynamic alert engine
- Automation system
- Abstraction over OBS operations

**Current status:**
- ✅ Module code complete
- ✅ Graceful fallback if no service provided
- ⏳ Waiting for main bot integration

Once `context.services.obs` is available, everything will "just work"!
