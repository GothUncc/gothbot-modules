# Phase 4 Quick Reference

## New Controllers Overview

### Virtual Camera 📹
```javascript
await context.obsControl.virtualCam.start();
await context.obsControl.virtualCam.setOutputFormat('NV12');
const status = await context.obsControl.virtualCam.getStatus();
```

### Replay Buffer 🎬
```javascript
await context.obsControl.replayBuffer.start();
const saved = await context.obsControl.replayBuffer.save();
const metrics = await context.obsControl.replayBuffer.getBufferStatus();
```

### Profiles 🎛️
```javascript
const profiles = await context.obsControl.profiles.listProfiles();
await context.obsControl.profiles.setProfile('Streaming');
await context.obsControl.profiles.createProfile('New-Profile');
```

### Scene Collections 🎭
```javascript
const collections = await context.obsControl.sceneCollections.listCollections();
await context.obsControl.sceneCollections.setCollection('Gaming');
await context.obsControl.sceneCollections.duplicateCollection('Gaming', 'Gaming-4K');
```

### Video Settings 📊
```javascript
const current = await context.obsControl.videoSettings.getFrameRate();
await context.obsControl.videoSettings.setFrameRate(60);
await context.obsControl.videoSettings.applyPreset('1080p', 'base');
```

---

## Common Use Cases

### Auto-Switch Profiles for Streaming
```javascript
context.on('stream:start', async () => {
  await context.obsControl.profiles.setProfile('Streaming');
  await context.obsControl.videoSettings.applyPreset('1080p', 'scaled');
});
```

### Instant Clip Capture
```javascript
context.on('raid', async (event) => {
  const status = await context.obsControl.replayBuffer.getStatus();
  if (status.canSave) {
    await context.obsControl.replayBuffer.save();
  }
});
```

### Multi-Setup Management
```javascript
const collections = {
  'Gaming': 'gaming-setup',
  'Creative': 'creative-setup',
  'IRL': 'outdoor-setup'
};

// Quick switch
await context.obsControl.sceneCollections.setCollection('Gaming');
```

### Adaptive Streaming
```javascript
const bitrate = await getNetworkBitrate();
if (bitrate < 5000) {
  await context.obsControl.videoSettings.applyPreset('720p', 'scaled');
  await context.obsControl.videoSettings.setFrameRate(30);
} else {
  await context.obsControl.videoSettings.applyPreset('1080p', 'scaled');
  await context.obsControl.videoSettings.setFrameRate(60);
}
```

---

## Method Count by Controller

| Controller | Methods | Version |
|------------|---------|---------|
| Audio | 13 | 2.0.0 |
| Streaming | 8 | 2.0.0 |
| Recording | 14 | 2.0.0 |
| SceneItems | 27 | 2.1.0 |
| Filters | 17 | 2.2.0 |
| Transitions | 11 | 2.2.0 |
| Scenes | 8 | 2.0.0 |
| Sources | 13 | 2.0.0 |
| Automation | 8 | 2.0.0 |
| **VirtualCam** | **11** | **2.3.0** |
| **ReplayBuffer** | **12** | **2.3.0** |
| **Profiles** | **11** | **2.3.0** |
| **SceneCollections** | **12** | **2.3.0** |
| **VideoSettings** | **16** | **2.3.0** |
| **TOTAL** | **174+** | **2.3.0** |

---

## Controller Files

```
modules/obs-control/
├── VirtualCamController.js
├── ReplayBufferController.js
├── ProfileController.js
├── SceneCollectionController.js
└── VideoSettingsController.js
```

---

## Error Handling Pattern

All controllers use consistent error format:
```javascript
{
  success: false,
  message: "User-friendly error description",
  error: "ERROR_CODE"
}
```

---

## Resolution Presets

Available in VideoSettingsController:
- `480p` → 854x480
- `720p` → 1280x720
- `1080p` → 1920x1080
- `1440p` → 2560x1440
- `4k` → 3840x2160
- `ultrawide` → 3440x1440

---

## Frame Rate Support

Direct support for:
- 24, 24.000 (cinema)
- 29.97, 30
- 48, 50
- 59.94, 60

Custom frame rates via: `setFrameRate(fps)`

---

## Video Formats

Supported formats:
- I420 (default)
- NV12
- UYVY
- YUY2

---

## Phase 4 Status

✅ **COMPLETE** - 5/5 controllers implemented  
✅ All 62 methods documented  
✅ Error handling throughout  
✅ Ready for automation integration  
✅ Next: Phase 5 Web UI

---

## Documentation Files

- `PHASE_4_IMPLEMENTATION.md` - Full technical details
- `PHASE_4_COMPLETION.md` - Completion summary
- `PHASE_4_QUICK_REFERENCE.md` - This file
- `claude.md` - Updated context file
- `catalog.json` - Updated module entry

