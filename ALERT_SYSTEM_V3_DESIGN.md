# 🔔 Alert System v3.0 - Complete Design Document

**Status**: Design Phase - DO NOT IMPLEMENT YET  
**Date**: November 17, 2025  
**Version**: 3.0.0-design

---

## 📋 Executive Summary

Next-generation alert system for stream events using unified overlay architecture. Supports all media types, AI-powered template generation, and complete visual customization.

---

## ✅ FINALIZED DESIGN DECISIONS

### 1. AI Integration: Local Ollama ✅
**Decision**: Use Ollama with Phi-3 Mini (3.8B) or Llama 3.2 3B
- **Cost**: Free (runs locally)
- **Speed**: 30-120 seconds (acceptable for luxury feature)
- **Fallback**: Visual builder if Ollama unavailable
- **Implementation**: HTTP API to localhost:11434

### 2. Media Storage: Local Filesystem → Optional Cloud ✅
**Phase 1 (MVP)**: Local storage only
- Store in `./modules/alerts/media/` directory
- Serve via HTTP: `/modules/alerts/media/sounds/celebration.mp3`
- Simple, free, works offline

**Phase 2 (Future)**: Add cloud storage option
- Config setting to enable Backblaze B2 / S3
- Hybrid mode: local + cloud sync
- For power users and multi-machine setups

### 3. Template Marketplace: Free Sharing Only ✅
- Import/export templates (JSON format)
- Community gallery with ratings
- **NO paid templates** (way down the line if ever)

### 4. Mobile App: Not Now ✅
- Make web UI responsive instead
- Full mobile app is future project for entire system

### 5. Webhooks: YES ✅
- `POST /api/alerts/webhook` endpoint
- API key authentication
- External services can trigger custom alerts

### 6. Module Interoperability: MANDATORY ✅
**CRITICAL REQUIREMENT**: All modules MUST expose functions via API

```javascript
// Alert module MUST register public API
context.registerApi('alerts', {
  showAlert: async (config) => { /* ... */ },
  clearQueue: () => { /* ... */ },
  getQueue: () => { /* ... */ },
  testAlert: async (type) => { /* ... */ },
  getTemplates: () => { /* ... */ },
  createTemplate: async (template) => { /* ... */ }
});

// Other modules consume via
const alertApi = context.getApi('alerts');
await alertApi.showAlert({ type: 'follow', username: 'viewer' });
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GothBot Core                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Unified Overlay System                      │  │
│  │  - Single OBS browser source                         │  │
│  │  - WebSocket for real-time updates                   │  │
│  │  - Renders: Alerts, Goals, Chat, Widgets, etc.      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ context.overlay.show()
                           │
┌─────────────────────────────────────────────────────────────┐
│              Alert System Module                             │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Event Listener │→ │  Alert Queue    │→ │  Overlay    │ │
│  │ - follow       │  │  - Priority     │  │  Renderer   │ │
│  │ - subscribe    │  │  - Concurrent   │  └─────────────┘ │
│  │ - raid         │  │  - Deduplication│                   │
│  │ - donation     │  └─────────────────┘                   │
│  │ - cheer        │                                         │
│  └────────────────┘                                         │
│                                                              │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Template       │  │  Media Manager  │  │  Admin UI   │ │
│  │ Engine         │  │  - Upload       │  │  - Builder  │ │
│  │ - Rendering    │  │  - Local Store  │  │  - Preview  │ │
│  │ - Variables    │  │  - Validation   │  │  - Test     │ │
│  └────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     AI Template Generator (Ollama - Optional)          │ │
│  │  User: "Make a neon cyberpunk alert with glitch"      │ │
│  │  Ollama: Generates HTML/CSS/JS (30-120 seconds)       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Design - See Full Mockups Above

### Main Admin UI - 4 Tabs
1. **📋 Templates** - Create, edit, preview alert templates
2. **⚙️ Settings** - Queue management, event filters, defaults
3. **🎵 Sounds** - Upload sounds, built-in library, volume control
4. **📊 History** - Alert log, replay, analytics

### Template Editor Features
- **Creation Methods**:
  - 🤖 AI Generator (Ollama)
  - 🎨 Visual Builder
  - 💻 Code Editor (HTML/CSS/JS)
  - 📤 Upload Template
  
- **Media Support**:
  - Images: JPG, PNG, WebP, SVG, GIF
  - Videos: MP4, WebM, AVI, MOV
  - YouTube embeds
  - External URLs

- **Animations**: Slide, Fade, Zoom, Bounce, Confetti, Custom CSS

- **Sound**: Upload custom sounds or use built-in library

- **TTS**: Text-to-speech with voice and speed controls

- **Variables**: {{username}}, {{displayName}}, {{amount}}, {{message}}, {{tier}}, {{months}}, {{viewers}}

---

## 🔧 Database Schema

```sql
-- Alert Templates
CREATE TABLE alert_templates (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  enabled BOOLEAN DEFAULT true,
  
  -- Rendering
  template_type VARCHAR,
  html_content TEXT,
  css_content TEXT,
  js_content TEXT,
  
  -- Media
  media_type VARCHAR,
  media_url TEXT,
  media_settings JSONB,
  
  -- Configuration
  duration INTEGER DEFAULT 5000,
  animation VARCHAR DEFAULT 'slide-in',
  sound_file VARCHAR,
  sound_volume DECIMAL DEFAULT 0.8,
  
  -- TTS
  tts_enabled BOOLEAN DEFAULT false,
  tts_voice VARCHAR,
  tts_speed DECIMAL DEFAULT 1.0,
  tts_template TEXT,
  
  -- Conditions
  min_amount DECIMAL,
  min_viewers INTEGER,
  vip_only BOOLEAN DEFAULT false,
  sub_only BOOLEAN DEFAULT false,
  first_time_only BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Alert Queue
CREATE TABLE alert_queue (
  id VARCHAR PRIMARY KEY,
  template_id VARCHAR REFERENCES alert_templates(id),
  event_type VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Alert History
CREATE TABLE alert_history (
  id VARCHAR PRIMARY KEY,
  template_id VARCHAR REFERENCES alert_templates(id),
  event_type VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  username VARCHAR,
  display_name VARCHAR,
  amount DECIMAL,
  message TEXT,
  displayed_at TIMESTAMP DEFAULT NOW(),
  duration INTEGER,
  viewer_count INTEGER,
  stream_id VARCHAR
);

-- Sound Library
CREATE TABLE alert_sounds (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  file_name VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  duration DECIMAL,
  format VARCHAR,
  default_volume DECIMAL DEFAULT 0.8,
  usage_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE alert_settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Endpoints

### Template Management
```
GET    /api/alerts/templates           # List all templates
GET    /api/alerts/templates/:id       # Get single template
POST   /api/alerts/templates           # Create template
PUT    /api/alerts/templates/:id       # Update template
DELETE /api/alerts/templates/:id       # Delete template
POST   /api/alerts/templates/:id/test  # Test template
```

### AI Generator
```
POST   /api/alerts/ai/generate         # Generate from natural language
Body: { 
  prompt: "cyberpunk follow alert with glitch effects",
  eventType: "follow"
}
```

### Sound Management
```
GET    /api/alerts/sounds              # List sounds
POST   /api/alerts/sounds/upload       # Upload sound file
DELETE /api/alerts/sounds/:id          # Delete sound
GET    /api/alerts/sounds/packs        # Get free sound packs
```

### Settings
```
GET    /api/alerts/settings            # Get all settings
PUT    /api/alerts/settings            # Update settings
```

### History & Analytics
```
GET    /api/alerts/history             # Get alert history
GET    /api/alerts/analytics           # Get statistics
DELETE /api/alerts/history             # Clear history
POST   /api/alerts/history/:id/replay  # Replay alert
```

### Queue Management
```
GET    /api/alerts/queue               # View current queue
POST   /api/alerts/queue/clear         # Clear queue
DELETE /api/alerts/queue/:id           # Remove from queue
```

### Webhooks (External Triggers)
```
POST   /api/alerts/webhook             # Trigger custom alert
Headers: { 'X-API-Key': 'your-key' }
Body: {
  type: 'custom',
  templateId: 'optional',
  data: { username: 'ExternalUser', message: '...' }
}
```

---

## 🔌 Module API (Interoperability)

### Required Exports
```javascript
// Alert module MUST expose these functions
context.registerApi('alerts', {
  // Core functions
  showAlert: async (config) => {
    // config: { type, data, templateId?, duration? }
    // Returns: { success: boolean, alertId?: string, error?: string }
  },
  
  // Queue management
  clearQueue: () => { /* Clear all pending alerts */ },
  getQueue: () => { /* Return array of pending alerts */ },
  pauseQueue: () => { /* Pause alert processing */ },
  resumeQueue: () => { /* Resume alert processing */ },
  
  // Template management
  getTemplates: () => { /* Return all templates */ },
  getTemplate: (id) => { /* Get single template */ },
  createTemplate: async (template) => { /* Create new template */ },
  
  // Testing
  testAlert: async (type) => { /* Trigger test alert */ }
});
```

### Usage by Other Modules
```javascript
// Example: Automation module triggers alert
const alertApi = context.getApi('alerts');

if (alertApi) {
  await alertApi.showAlert({
    type: 'custom',
    data: {
      username: 'AutomationBot',
      message: 'Automated task completed!'
    },
    duration: 5000
  });
}
```

---

## 📦 Supported Media Types

| Type | Formats | Max Size | Use Case |
|------|---------|----------|----------|
| Image | JPG, PNG, WebP, SVG, GIF | 5 MB | Static backgrounds, badges |
| Video | MP4, WebM, AVI, MOV | 50 MB | Animated backgrounds |
| YouTube | URL/Embed | N/A | Music clips, memes |
| External | Any URL | N/A | Remote CDN assets |
| Sound | MP3, WAV, OGG, M4A | 5 MB | Alert audio |

---

## 🤖 AI Template Generator

### Ollama Setup
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull model (choose one)
ollama pull phi3:mini     # 3.8B - Recommended
ollama pull llama3.2:3b   # 3B - Alternative
```

### Generation Flow
```
User Input: "Purple cyberpunk alert with glitch effects"
  ↓
[Generating... ⏳] (30-120 seconds)
  ↓
Ollama generates HTML/CSS/JS
  ↓
[Preview Ready ✓]
  ↓
User: [✓ Accept] [✏️ Edit] [🔄 Regenerate]
```

### Prompt Template
```
You are an expert web designer creating stream alert overlays.
Generate ONLY valid HTML with inline CSS and JavaScript.

Template Variables: {{username}}, {{displayName}}, {{amount}}, {{message}}
Requirements:
- Complete HTML document
- Transparent background (1920x1080)
- Entrance/exit animations
- Duration: 5000ms

User Request: {prompt}

Return ONLY the HTML template code.
```

---

## 🎯 Feature Priority

### Phase 1: MVP (Must Have)
- Template CRUD (create, read, update, delete)
- Event subscription (follow, sub, raid, donation, cheer)
- Alert queue with priority system
- Basic animations (slide, fade, zoom)
- Sound support (upload + library)
- Unified overlay integration
- Admin UI (4 tabs: templates, settings, sounds, history)
- Test mode
- Module API registration

### Phase 2: Enhanced (Should Have)
- Visual template builder
- Custom CSS editor
- Media upload (images, videos, GIFs)
- YouTube embed support
- TTS integration
- Alert history & analytics
- Template import/export
- Webhook support

### Phase 3: Advanced (Nice to Have)
- AI template generator (Ollama)
- Template marketplace/sharing
- Advanced conditions (VIP only, first time)
- Alert variations (different templates per tier)
- Multi-language support
- Cloud storage option (B2/S3)

---

## 🚀 Success Metrics

- **Adoption**: 80%+ of streamers enable alerts
- **Customization**: 60%+ create custom templates
- **Performance**: Alerts display within 500ms of event
- **Stability**: 99.9% uptime, no missed alerts
- **Satisfaction**: 4.5+ star rating

---

## 🔄 Integration with Unified Overlay

```javascript
// Alert module calls Core's overlay system
async function displayAlert(alert) {
  await context.overlay.show({
    component: 'Alert',
    layer: 100,  // High z-index
    data: {
      templateId: alert.template_id,
      eventType: alert.event_type,
      eventData: alert.event_data,
      duration: alert.display_duration,
      animation: alert.animation,
      sound: alert.sound_file,
      soundVolume: alert.sound_volume
    },
    duration: alert.display_duration,
    onComplete: () => {
      markAlertComplete(alert.id);
      processNextAlert();
    }
  });
}
```

---

## 📝 Next Steps

**STATUS: DESIGN APPROVED - READY FOR PLANNING**

Before implementation:
1. ✅ Review complete UI mockups
2. ✅ Confirm database schema
3. ✅ Validate API endpoints
4. ✅ Check module interoperability pattern
5. ⏳ Create implementation plan (phases/sprints)
6. ⏳ Set up development environment
7. ⏳ Begin Phase 1 development

---

**DO NOT START CODING UNTIL USER CONFIRMS DESIGN APPROVAL**
