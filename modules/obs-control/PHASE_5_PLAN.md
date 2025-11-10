# Phase 5 Implementation Plan: Web-Based Control Panel UI

**Phase**: 5 - Admin Dashboard & Control Panel  
**Version Target**: 2.4.0  
**Estimated Duration**: 2-3 weeks  
**Status**: Planning

---

## Overview

Build a comprehensive web-based control panel UI for OBS Master Control, allowing users to manage all 14 controllers through an intuitive dashboard.

## Architecture

### Frontend Stack
- **Framework**: Svelte (SvelteKit with existing module system)
- **Styling**: Tailwind CSS + CSS Modules
- **State**: Svelte stores for real-time updates
- **Real-time**: WebSocket for live status updates

### Backend Stack
- **Routes**: API endpoints for each controller
- **WebSocket**: Real-time event broadcasting
- **Auth**: Module context auth (existing system)
- **Data**: Controller method calls via module context

---

## UI Components Structure

### Main Dashboard (`+page.svelte`)
```
┌─────────────────────────────────────────────────────────┐
│  OBS Master Control Panel v2.3.0                       │
├─────────────────────────────────────────────────────────┤
│  [Status: Connected] [Connected: 12:34:56]             │
├──────────────────┬──────────────────────────────────────┤
│  Profiles        │ Current: Streaming                   │
│  Collections     │ ✓ 9 Profiles | ✓ 3 Collections      │
│  Video Settings  │ ✓ Virtual Cam | ✓ Replay Buffer    │
│  Replay Buffer   │                                      │
│  Virtual Cam     │ 1920x1080@60fps (Optimal)           │
│  Automation      │                                      │
│  Alerts          │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Section Breakdown

#### 1. Connection Status Card
- OBS connection status (Connected/Disconnected)
- Connection time
- Last activity timestamp
- Quick reconnect button

#### 2. Profiles Tab
- List all profiles
- Highlight current profile
- Quick switch buttons
- Create new profile
- Delete profile (with confirmation)
- Import/export profiles

#### 3. Scene Collections Tab
- List all collections
- Highlight current collection
- Quick switch buttons
- Create new collection
- Duplicate collection
- Export collection
- Organize by category

#### 4. Video Settings Tab
- Resolution presets (480p, 720p, 1080p, 1440p, 4K, ultrawide)
- FPS selector (24, 30, 48, 50, 59.94, 60)
- Base vs Scaled resolution sliders
- Video format selector
- Preview: Current settings display
- Apply button

#### 5. Replay Buffer Control
- Start/Stop toggle
- Save clip button (disabled when not running)
- Buffer status (active/inactive)
- Metrics display:
  - Total saves
  - Last save time
  - Buffer duration
  - File size (if available)
- Configure max duration

#### 6. Virtual Camera Control
- Start/Stop toggle
- Status indicator (running/stopped)
- Format selector
- Device capabilities display
- Platform indicator (Windows/macOS/Linux)

#### 7. Automation Rule Builder
- Visual rule creation:
  - IF: Event selector
  - THEN: Action selector
  - Config options for action
- Save/edit/delete rules
- Test rule button
- Preview rule execution
- Rule list with on/off toggles

#### 8. Alert Testing
- Alert type selector (Follow, Subscribe, Raid, Donation, Cheer)
- Customize alert message
- Preview alert animation
- Play sound preview
- Send test alert button
- TTS preview

---

## API Endpoints

### Status Endpoints
```
GET /api/modules/obs-control/status
  → { connected, uptime, version, controllerCount }

GET /api/modules/obs-control/health
  → { status, latency, lastUpdate }
```

### Profile Endpoints
```
GET /api/modules/obs-control/profiles
  → { profiles, current, total }

POST /api/modules/obs-control/profiles/switch
  → { profileName } → { success, newProfile }

POST /api/modules/obs-control/profiles/create
  → { profileName, copyFrom? } → { success, profileName }

POST /api/modules/obs-control/profiles/delete
  → { profileName } → { success, remaining }
```

### Collection Endpoints
```
GET /api/modules/obs-control/collections
  → { collections, current, total }

POST /api/modules/obs-control/collections/switch
  → { collectionName } → { success, newCollection }

POST /api/modules/obs-control/collections/create
  → { collectionName } → { success, collectionName }

POST /api/modules/obs-control/collections/duplicate
  → { source, newName } → { success, newCollection }
```

### Video Settings Endpoints
```
GET /api/modules/obs-control/video-settings
  → { baseResolution, scaledResolution, frameRate, format }

POST /api/modules/obs-control/video-settings/resolution
  → { type: 'base'|'scaled', width, height } → { success, applied }

POST /api/modules/obs-control/video-settings/fps
  → { fps } → { success, applied, actual }

POST /api/modules/obs-control/video-settings/preset
  → { preset, target: 'base'|'scaled' } → { success, applied }
```

### Replay Buffer Endpoints
```
GET /api/modules/obs-control/replay-buffer/status
  → { isRunning, metrics }

POST /api/modules/obs-control/replay-buffer/start
  → { success, status }

POST /api/modules/obs-control/replay-buffer/stop
  → { success, status }

POST /api/modules/obs-control/replay-buffer/save
  → { success, filename, timestamp }
```

### Virtual Camera Endpoints
```
GET /api/modules/obs-control/virtual-cam/status
  → { isRunning, format, supported }

POST /api/modules/obs-control/virtual-cam/start
  → { success, format }

POST /api/modules/obs-control/virtual-cam/stop
  → { success }

POST /api/modules/obs-control/virtual-cam/format
  → { format } → { success, applied }
```

### Automation Endpoints
```
GET /api/modules/obs-control/automation/rules
  → { rules: [...] }

POST /api/modules/obs-control/automation/rules
  → { trigger, action, config } → { success, ruleId }

POST /api/modules/obs-control/automation/rules/:id/test
  → { } → { success, result }

DELETE /api/modules/obs-control/automation/rules/:id
  → { } → { success }
```

---

## Real-time Updates (WebSocket)

### Event Types
```javascript
// Profile changes
'obs:profile-changed'
  → { newProfile, previousProfile, timestamp }

// Collection changes
'obs:collection-changed'
  → { newCollection, timestamp }

// Video settings changed
'obs:video-settings-changed'
  → { settings, timestamp }

// Replay buffer event
'obs:replay-buffer-saved'
  → { filename, timestamp, duration }

// Virtual cam status
'obs:virtual-cam-toggled'
  → { running, timestamp }

// Connection status
'obs:connected'
  → { timestamp, version }

'obs:disconnected'
  → { timestamp, reason }
```

---

## Component File Structure

```
routes/modules/obs-control/
├── +page.svelte                    # Main dashboard
├── +page.server.js                 # Server-side logic
├── +layout.svelte                  # Layout wrapper
├── +layout.server.js               # Layout server logic
├── components/
│   ├── ConnectionStatus.svelte
│   ├── ProfileSwitcher.svelte
│   ├── CollectionSwitcher.svelte
│   ├── VideoSettings.svelte
│   ├── ReplayBufferControl.svelte
│   ├── VirtualCamControl.svelte
│   ├── AutomationBuilder.svelte
│   ├── AlertTester.svelte
│   └── Tabs.svelte
├── stores/
│   ├── obsStatus.js                # Connection status
│   ├── profiles.js                 # Profile management
│   ├── collections.js              # Collection management
│   ├── videoSettings.js            # Video config
│   ├── replayBuffer.js             # Replay buffer state
│   ├── virtualCam.js               # Virtual camera state
│   ├── automation.js               # Automation rules
│   └── alerts.js                   # Alert state
└── lib/
    ├── api.js                      # API client
    ├── websocket.js                # WebSocket handler
    ├── utils.js                    # Utility functions
    └── presets.js                  # Resolution/FPS presets
```

---

## Styling Strategy

### Color Scheme (Dark Theme)
```
Primary: #1f2937 (dark gray)
Secondary: #374151 (lighter gray)
Accent: #3b82f6 (blue)
Success: #10b981 (green)
Warning: #f59e0b (amber)
Error: #ef4444 (red)
```

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Component Styling
- Svelte component scoped styles
- Tailwind utility classes
- CSS custom properties for theming
- Dark mode support via `prefers-color-scheme`

---

## State Management

### Svelte Stores
```javascript
// obsStatus.js
export const connectionStatus = writable('disconnected');
export const uptime = writable('00:00:00');
export const version = writable('2.3.0');

// profiles.js
export const profiles = writable([]);
export const currentProfile = writable(null);
export const isLoading = writable(false);

// videoSettings.js
export const baseResolution = writable({ width: 1920, height: 1080 });
export const frameRate = writable(60);
export const videoFormat = writable('I420');

// Similar pattern for other stores
```

---

## Error Handling

### User Feedback
- Toast notifications for success/error
- Inline error messages in forms
- Loading states on async operations
- Disabled states for unavailable actions

### Error Types
- Connection errors
- Validation errors
- Permission errors
- OBS operation errors
- Network timeouts

---

## Performance Optimization

### Lazy Loading
- Load components on tab switch
- Lazy load heavy lists (profiles, collections)

### Caching
- Cache API responses client-side
- Re-validate on manual refresh
- WebSocket pushes updates in real-time

### Debouncing
- Debounce slider inputs (resolution/FPS)
- Debounce search/filter inputs
- Throttle WebSocket reconnection attempts

---

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast ratios > 4.5:1
- Focus indicators on all interactive elements

### Keyboard Support
- Tab through all controls
- Enter/Space to activate buttons
- Arrow keys for sliders
- Escape to close modals

---

## Testing Strategy

### Unit Tests
- Component rendering
- Store updates
- API response parsing

### Integration Tests
- API endpoint functionality
- WebSocket updates
- Full workflow (switch profile → see UI update)

### E2E Tests
- Complete user workflows
- Connection/reconnection scenarios
- Error recovery

---

## Phase 5 Milestones

### Week 1
- ✅ Dashboard layout and components
- ✅ API endpoints
- ✅ Basic tab switching

### Week 2
- ✅ Profile management UI
- ✅ Collection management UI
- ✅ Video settings panel

### Week 3
- ✅ Replay buffer & virtual cam UI
- ✅ Automation builder
- ✅ Alert testing
- ✅ WebSocket real-time updates
- ✅ Styling & responsive design

### Final
- ✅ Testing and bug fixes
- ✅ Documentation
- ✅ Release v2.4.0

---

## Success Criteria

- ✅ All 14 controllers accessible from UI
- ✅ Real-time status updates
- ✅ Mobile responsive design
- ✅ < 100ms latency for API calls
- ✅ < 2 second initial load time
- ✅ Zero accessibility violations
- ✅ All keyboard controls working
- ✅ 95%+ test coverage

---

## Future Enhancements (Post-Phase 5)

- Mobile app (React Native)
- Remote control from phone
- Streaming dashboard integration
- Performance analytics
- Integration with chat commands
- Voice control
- Custom theme support
- Plugin system for extensions

