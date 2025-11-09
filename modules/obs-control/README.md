# OBS Control & Dynamic Overlays

Foundation module for all OBS integration and overlay features in GothBot.

## Status: Phase 1 - Scaffolding Complete ✅

This module is currently in development following the implementation plan in `MODULE_36_IMPLEMENTATION_PLAN.md`.

### Completed
- ✅ Module structure created
- ✅ Configuration schema defined
- ✅ Lifecycle hooks scaffolded
- ✅ Public API interface defined

### TODO
- ⏳ Phase 2: Dynamic Alert Engine
- ⏳ Phase 3: Automation Engine
- ⏳ Phase 4: Module Context API
- ⏳ Phase 5: Admin UI

## Installation

Install from the GothBot marketplace:

1. Navigate to **Modules** → **Marketplace**
2. Find "OBS Control & Dynamic Overlays"
3. Click **Install**
4. Click **Enable**
5. Configure OBS WebSocket settings

## Configuration

- **OBS WebSocket Host**: Hostname or IP (default: `localhost`)
- **OBS WebSocket Port**: Port number (default: `4455`)
- **OBS WebSocket Password**: Leave blank if no password
- **Auto Reconnect**: Automatically reconnect on disconnect (default: `true`)
- **Reconnect Delay**: Time to wait before reconnecting in ms (default: `5000`)

## Features (Planned)

- OBS WebSocket connection with auto-reconnect
- Dynamic alert source creation and management
- Event-driven automation engine
- Scene management and switching
- Source control (show/hide/create)
- Alert queue system with concurrent limits
- Media playback control
- Real-time streaming and recording stats
- Module Context API for other modules

## For Module Developers

Once complete, other modules can access OBS functionality via:

```javascript
async initialize(context) {
  // Check if OBS Control is available
  if (!context.obsApi) {
    context.logger.warn('OBS Control module not available');
    return;
  }

  // Use OBS API
  const connected = context.obsApi.isConnected();
  const scenes = await context.obsApi.getScenes();
  
  await context.obsApi.showAlert({
    type: 'follow',
    username: 'viewer123',
    duration: 5000
  });
}
```

## Requirements

- GothBot v2.0.116+
- OBS Studio 28+ with WebSocket plugin enabled

## License

MIT
