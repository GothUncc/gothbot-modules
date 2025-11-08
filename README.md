# GothBot Module Marketplace

Official module marketplace for [GothomationBot v2.0](https://github.com/GothUncc/gothomationbotV2).

## Overview

This repository hosts the official catalog of modules available for GothBot. The module system enables hot-loadable, sandboxed extensions that can react to platform events, store data, and add functionality without requiring bot restarts.

## Available Modules

### 🎥 OBS Control & Dynamic Overlays (v1.0.0) - **NEW!**

Foundation module for all OBS integration and overlay features.

**Features:**
- OBS WebSocket connection with auto-reconnect
- Dynamic alert source creation and management
- Event-driven automation engine
- Scene management and switching
- Alert queue system with concurrent limits
- 7+ automation action types
- Real-time streaming and recording stats
- Module Context API for other modules

**Requirements:** OBS Studio 28+ with WebSocket enabled

**Installation:** Available in GothBot v2.0.116+

[Documentation](https://github.com/GothUncc/gothomationbotV2/blob/main/modules/obs-control/README.md) | [Quick Start](https://github.com/GothUncc/gothomationbotV2/blob/main/modules/obs-control/QUICKSTART.md)

---

### 🔔 Alert System (v1.0.0)

Multi-platform stream alerts with custom animations and sounds.

**Features:**
- 5 alert types (Follow, Subscribe, Raid, Donation, Cheer)
- 5 animation styles (Slide, Fade, Bounce, Zoom, Confetti)
- Custom sound effects + TTS support
- OBS browser source integration
- Smart queue management
- 17+ configuration options

**Installation:** Available in GothBot v2.0.116+

[Documentation](https://github.com/GothUncc/gothomationbotV2/blob/main/modules/alerts/README.md) | [Quick Start](https://github.com/GothUncc/gothomationbotV2/blob/main/ALERT_SYSTEM_QUICKSTART.md)

## Coming Soon

- 🎮 **Chat Commands** - Custom chat commands and responses
- 💬 **Chat Overlay** - Multi-platform chat display for OBS
- 🎯 **Goal Tracker** - Stream goals and progress bars
- 🎵 **Sound Alerts** - Viewer-triggered sound effects
- 💡 **Smart Lights** - Philips Hue/LIFX integration
- 🔗 **Discord Integration** - Two-way Discord/stream chat sync

## For Module Developers

### Publishing to Marketplace

1. **Create Your Module** following the [Module System Documentation](https://github.com/GothUncc/gothomationbotV2/blob/main/MODULE_SYSTEM.md)
2. **Test Thoroughly** in your local GothBot instance
3. **Submit PR** to this repository adding your module to `catalog.json`

### Module Entry Format

```json
{
  "id": "your-module-id",
  "name": "Your Module Name",
  "version": "1.0.0",
  "description": "Brief description of what your module does",
  "author": "Your Name",
  "category": "overlay|integration|chat|automation",
  "tags": ["tag1", "tag2"],
  "icon": "🎯",
  "downloadUrl": "https://...",
  "installType": "bundled|npm|git",
  "features": ["Feature 1", "Feature 2"],
  "requirements": {
    "botVersion": ">=2.0.116",
    "moduleFramework": ">=1.0.0"
  },
  "documentation": "https://...",
  "repository": "https://...",
  "license": "MIT",
  "verified": false,
  "official": false
}
```

### Categories

- **overlay** - Visual overlays for OBS/stream
- **integration** - Third-party service integrations
- **chat** - Chat commands and interactions
- **automation** - Automated tasks and workflows
- **analytics** - Stats, tracking, and reporting
- **utility** - Helper tools and utilities

### Verification

Modules marked as `"official": true` are maintained by the GothBot team. Third-party modules can apply for `"verified": true` status after review.

## Installation

Modules are installed directly from the GothBot admin panel:

1. Navigate to **Modules** → **Marketplace**
2. Browse or search for modules
3. Click **Install** on desired module
4. Click **Enable** to activate
5. Configure module settings

## Module System

The GothBot module system provides:

- ✅ **Hot-loading** - Install/enable/disable without restarting
- ✅ **Sandboxing** - isolated-vm for security
- ✅ **Event System** - Subscribe to platform events
- ✅ **Data Storage** - PostgreSQL-backed persistence
- ✅ **Configuration** - JSON Schema-driven UI
- ✅ **Logging** - Module-attributed logs
- ✅ **API Access** - Controlled access to core services

## Support

- **Documentation**: [MODULE_SYSTEM.md](https://github.com/GothUncc/gothomationbotV2/blob/main/MODULE_SYSTEM.md)
- **Issues**: [GitHub Issues](https://github.com/GothUncc/gothomationbotV2/issues)
- **Discord**: Coming soon

## License

This repository is MIT licensed. Individual modules may have different licenses - check each module's documentation.

---

**Built with ❤️ by the GothBot Team**
