# Alert System v3.0

Next-generation alert system for stream events using unified overlay architecture. Supports all media types, template management, and complete visual customization.

## ✨ Features

### Core Functionality
- ✅ **Unified Overlay Architecture** - Uses Core's overlay system (not static OBS sources)
- ✅ **Template Management** - Create, edit, and customize alert templates
- ✅ **5 Alert Types** - Follow, Subscribe, Raid, Donation, Cheer/Bits
- ✅ **Module API** - Full programmatic access for other modules
- ✅ **Smart Queue** - Priority-based alert processing with concurrent limits
- ✅ **Event Subscriptions** - Auto-trigger alerts from platform events

### Admin UI (4 Tabs)
- **📋 Templates** - Manage alert templates with visual editor
- **⚙️ Settings** - Configure queue, filters, thresholds, and behavior
- **🎵 Sounds** - Upload and manage sound library
- **📊 History** - View, filter, and replay past alerts

### Template System
- **HTML/CSS Editor** - Full control over alert appearance
- **Template Variables** - `{{username}}`, `{{displayName}}`, `{{amount}}`, `{{message}}`, `{{tier}}`, `{{months}}`, `{{viewers}}`, `{{currency}}`
- **5 Default Templates** - Pre-built templates for each alert type
- **Animations** - Slide In, Fade, Bounce, Zoom, Confetti
- **Custom Duration** - Set how long each alert displays
- **Sound Integration** - Attach audio files to templates

### Advanced Features
- **Conditional Display** - Min amount, min viewers, VIP/Sub only
- **Alert Queue** - Prevents overlaps, priority ordering
- **Test Mode** - Preview alerts before going live
- **History Tracking** - Analytics and replay functionality
- **Export/Import** - Share templates (CSV export for history)
- **Webhook Support** - External services can trigger alerts

## 📦 Installation

1. Navigate to **Modules** → **Marketplace** in GothBot
2. Find "Alert System"
3. Click **Install**
4. Click **Enable**
5. Access UI at **Modules** → **Alert System**

## 🎯 Quick Start

### 1. Access the Admin UI

Navigate to the Alert System module UI to manage templates and settings.

### 2. Review Default Templates

The system comes with 5 pre-configured templates:
- Follow Alert (purple gradient)
- Subscribe Alert (pink gradient)
- Raid Alert (yellow gradient)
- Donation Alert (blue gradient)
- Cheer Alert (pastel gradient)

### 3. Test an Alert

In the **Templates** tab, click **Test** on any template to see how it looks.

### 4. Customize Templates

Click **Edit** on a template to modify:
- HTML content with template variables
- CSS styling and animations
- Duration and sound settings
- Display conditions

### 5. Configure Settings

In the **Settings** tab:
- Enable/disable alert types
- Set minimum thresholds
- Configure queue behavior
- Adjust filters

## 🔌 Module API

Other modules can integrate with the Alert System:

```javascript
async initialize(context) {
  const alertApi = context.getApi('alerts');
  
  if (alertApi) {
    // Show a custom alert
    await alertApi.showAlert({
      type: 'follow',
      data: {
        username: 'CoolViewer',
        displayName: 'CoolViewer'
      }
    });
    
    // Get queue status
    const status = alertApi.getQueueStatus();
    console.log(`Queue: ${status.queueLength} pending`);
    
    // Get all templates
    const templates = alertApi.getTemplates();
    
    // Test an alert
    await alertApi.testAlert('subscribe');
    
    // Create a custom template
    await alertApi.createTemplate({
      name: 'My Custom Alert',
      eventType: 'follow',
      htmlContent: '<div>Custom content</div>',
      cssContent: '.custom { color: red; }',
      duration: 5000
    });
  }
}
```

### Available API Methods

- `showAlert(config)` - Display an alert
- `testAlert(type)` - Test a specific alert type
- `getTemplates(filter)` - Get all templates (optionally filtered)
- `getTemplate(id)` - Get a specific template
- `createTemplate(template)` - Create a new template
- `updateTemplate(id, updates)` - Update a template
- `deleteTemplate(id)` - Delete a template
- `getQueue()` - Get pending alerts
- `getQueueStatus()` - Get queue status
- `clearQueue()` - Clear all pending alerts
- `pauseQueue()` - Pause alert processing
- `resumeQueue()` - Resume alert processing

## 📝 Template Variables

Use these variables in your HTML/CSS content:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{username}}` | Platform username | `coolviewer` |
| `{{displayName}}` | Display name | `CoolViewer` |
| `{{amount}}` | Donation/bits amount | `5.00` or `100` |
| `{{message}}` | User message | `Great stream!` |
| `{{tier}}` | Subscription tier | `1`, `2`, or `3` |
| `{{months}}` | Months subscribed | `1`, `12`, etc. |
| `{{viewers}}` | Raid viewer count | `50` |
| `{{currency}}` | Currency code | `USD`, `EUR`, etc. |

## 🎨 Creating Custom Templates

### Example: Custom Follow Alert

```html
<!-- HTML Content -->
<div class="custom-alert">
  <div class="icon">🎉</div>
  <div class="content">
    <div class="title">New Follower!</div>
    <div class="name">{{displayName}}</div>
  </div>
</div>
```

```css
/* CSS Content */
.custom-alert {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  animation: slideInFromTop 0.5s ease-out;
}

.icon {
  font-size: 60px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: white;
}

.name {
  font-size: 40px;
  font-weight: bold;
  color: #FFD700;
}

@keyframes slideInFromTop {
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## ⚙️ Configuration Options

### Queue Settings
- **Max Concurrent** - How many alerts can display at once (1-5)
- **Min Delay** - Minimum time between alerts in milliseconds

### Event Filters
- **Enable/Disable** - Toggle specific alert types
- **Min Raid Viewers** - Only show raids above this count
- **Min Donation Amount** - Minimum donation to trigger alert
- **Min Cheer Bits** - Minimum bits to trigger alert

### Alert Behavior
- **Deduplication** - Prevent duplicate alerts
- **Pause During BRB** - Pause alerts when stream is in BRB scene
- **Auto-Skip** - Skip alerts when stream is offline

## 🔄 Migration from v1.0.x

### What Changed

**Breaking Changes:**
- No longer uses static OBS browser sources
- Now integrates with Core's unified overlay system
- Module API completely restructured

**What to Do:**
1. **Remove old browser source** - Not needed anymore
2. **Configuration preserved** - Your settings will work
3. **Templates new** - Default templates included, customize as needed
4. **Test alerts** - Verify everything works after upgrade

### Benefits of v3.0
- ✅ No persistent OBS sources cluttering your scene list
- ✅ Dynamic alert rendering through unified overlay
- ✅ Better performance and reliability
- ✅ Full template customization
- ✅ Module interoperability
- ✅ Professional admin UI

## 📡 Webhook API

Trigger alerts from external services:

```bash
POST /api/alerts/webhook
Content-Type: application/json
X-API-Key: your-api-key

{
  "type": "custom",
  "templateId": "template_123",
  "data": {
    "username": "ExternalUser",
    "displayName": "External User",
    "amount": 10.00,
    "message": "From external service"
  }
}
```

## 🐛 Troubleshooting

### Alerts Not Showing

1. **Check overlay system** - Ensure Core's unified overlay is working
2. **Check module logs** - Look for errors in module logs
3. **Test alert** - Use test mode to verify functionality
4. **Check queue** - Queue might be paused or full

### Templates Not Saving

1. **Check permissions** - Module needs storage access
2. **Check logs** - Look for save errors
3. **Validate HTML/CSS** - Ensure no syntax errors

### No Sound Playing

1. **Check sound library** - Ensure sound file uploaded
2. **Check volume** - Volume set too low
3. **Check browser** - Browser may block autoplay

## 🎓 Advanced Usage

### Custom Animation Example

```css
@keyframes customEntry {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.alert-container {
  animation: customEntry 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Conditional Display Logic

Set conditions in template settings:
- **Min Amount** - Only show if amount >= threshold
- **Min Viewers** - Only show if viewers >= threshold
- **VIP Only** - Only show for VIP viewers
- **Sub Only** - Only show for subscribers
- **First Time Only** - Only show for first-time events

## 📊 Analytics

The **History** tab provides:
- Total alerts displayed
- Breakdown by type (follows, subs, raids, etc.)
- Date filtering and search
- Replay functionality
- CSV export for external analysis

## 🔐 Security

- Webhook API requires X-API-Key header
- Templates run in sandboxed environment
- No direct filesystem access
- Input validation on all endpoints

## 🚀 Performance

- Queue system prevents alert overlaps
- Efficient storage using context.storage
- Minimal memory footprint
- Fast template rendering

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

- **Documentation**: This README
- **Issues**: GitHub Issues
- **Discord**: Community Discord (coming soon)

## 🔮 Future Features (Phase 2+)

- AI template generation (Ollama integration)
- Template marketplace
- Cloud media storage (Backblaze B2/S3)
- Advanced animations library
- Multi-language support
- Video/GIF media support
- YouTube embed support

---

**Version**: 3.0.0  
**Status**: Production Ready  
**Maintained by**: GothBot Team
