# OBS Control - Quick Start Guide

Get up and running with OBS Control in 5 minutes!

## Prerequisites

- GothBot v2.0.116 or higher
- OBS Studio 28+ installed
- OBS WebSocket plugin enabled (included in OBS 28+)

## Step 1: Enable OBS WebSocket

1. Open **OBS Studio**
2. Go to **Tools** → **WebSocket Server Settings**
3. Check **Enable WebSocket server**
4. Note the **Port** (default: 4455)
5. Set a **Password** (optional but recommended)
6. Click **Apply** and **OK**

## Step 2: Install Module

1. Open GothBot admin panel
2. Navigate to **Modules** → **Marketplace**
3. Find **OBS Control & Dynamic Overlays**
4. Click **Install**
5. Click **Enable**

## Step 3: Configure Connection

1. Go to **Modules** → **OBS Control** → **Configure**
2. Enter your settings:
   - **Host**: `localhost` (if OBS is on same machine)
   - **Port**: `4455` (or your custom port)
   - **Password**: Your OBS WebSocket password
   - **Auto Reconnect**: `true`
3. Click **Save**

## Step 4: Verify Connection

Check the module logs:

```
[OBS Control] Connected to OBS
[OBS Control] OBS Control module initialized successfully
```

## Usage Examples

### For Module Developers

Access OBS functionality from your module:

```javascript
export default {
  name: 'my-module',
  
  async initialize(context) {
    // Check if OBS Control is available
    if (!context.obsApi) {
      context.logger.warn('OBS Control not available');
      return;
    }

    // Show alert
    await context.obsApi.showAlert({
      type: 'follow',
      username: 'viewer123',
      duration: 5000
    });

    // Switch scene
    await context.obsApi.setScene('Gaming Scene');

    // Register automation
    context.obsApi.registerAutomation({
      eventType: 'subscribe',
      actions: [
        { type: 'show_source', scene: 'Main', source: 'SubAlert' },
        { type: 'delay', duration: 5000 },
        { type: 'hide_source', scene: 'Main', source: 'SubAlert' }
      ]
    });
  }
};
```

### Example: Follow Alert

```javascript
context.on('follow', async (event) => {
  if (context.obsApi.isConnected()) {
    await context.obsApi.showAlert({
      type: 'follow',
      username: event.user.displayName,
      message: `Thanks for the follow!`,
      duration: 5000
    });
  }
});
```

### Example: Raid Scene Switch

```javascript
context.obsApi.registerAutomation({
  eventType: 'raid',
  conditions: {
    minViewers: 10
  },
  actions: [
    { type: 'switch_scene', sceneName: 'Raid Celebration' },
    { type: 'delay', duration: 10000 },
    { type: 'switch_scene', sceneName: 'Main' }
  ]
});
```

## Available API Methods

### Connection
- `isConnected()` - Check connection status

### Scenes
- `getScenes()` - Get all scenes
- `getCurrentScene()` - Get current scene name
- `setScene(name)` - Switch to scene

### Sources
- `showSource(scene, source)` - Show source
- `hideSource(scene, source)` - Hide source
- `createSource(config)` - Create dynamic source
- `removeSource(id)` - Remove dynamic source

### Alerts
- `showAlert(config)` - Display alert
- `hideAlert(id)` - Hide alert early
- `getAlertQueueStatus()` - Get queue info

### Automation
- `registerAutomation(rule)` - Add automation rule
- `unregisterAutomation(id)` - Remove rule
- `executeAction(action)` - Execute single action
- `getAutomations()` - Get all rules

### Media
- `playMedia(source)` - Play media
- `pauseMedia(source)` - Pause media
- `restartMedia(source)` - Restart media

### Stream/Record
- `startStreaming()` - Start stream
- `stopStreaming()` - Stop stream
- `startRecording()` - Start recording
- `stopRecording()` - Stop recording

### Stats
- `getStats()` - System stats
- `getStreamingStats()` - Stream stats
- `getRecordingStats()` - Recording stats

## Troubleshooting

### Module won't connect

**Check:**
- OBS is running
- WebSocket server is enabled in OBS
- Port is correct (default 4455)
- Password matches (if set)
- No firewall blocking connection

**View logs:**
```
Modules → OBS Control → View Logs
```

### Alerts not showing

**Check:**
- Module is connected (`isConnected()` returns true)
- Alert queue isn't full (max 3 concurrent)
- Browser source URL is accessible
- OBS scene contains the alert source

### Performance issues

**Optimize:**
- Limit concurrent alerts (default: 3)
- Reduce alert duration
- Use simpler animations
- Close unused OBS sources

## Next Steps

- Explore automation rules
- Build custom overlays
- Create alert templates
- Integrate with other modules

## Support

- **Documentation**: [Full README](README.md)
- **Issues**: [GitHub Issues](https://github.com/GothUncc/gothbot-modules/issues)
- **Module System**: [Architecture Guide](../../architecture.md)

---

**Happy Streaming! 🎥**
