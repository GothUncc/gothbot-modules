# Changelog

All notable changes to the Alert System module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-11-17

### Changed - Major Architecture Rewrite
- **BREAKING**: Moved from static OBS browser sources to unified overlay architecture
- **BREAKING**: Now uses `context.overlay.show()` instead of direct OBS source creation
- **BREAKING**: Module API renamed and restructured for interoperability
- Alert system now integrates with Core's unified overlay endpoint
- Alerts render dynamically without persistent OBS sources
- Complete rewrite for GothBot v2 module marketplace standards

### Added
- Module API registration via `context.registerApi('alerts', {...})` for other modules
- Template system with persistent storage
- Alert queue management with priority support
- Default templates for all 5 alert types (follow, subscribe, raid, donation, cheer)
- `showAlert()` - Trigger alerts programmatically from other modules
- `clearQueue()` - Clear pending alerts
- `getQueue()` - View pending alerts
- `getTemplates()` - List available templates
- `createTemplate()` - Create custom alert templates
- `testAlert()` - Test specific alert types
- Graceful fallback when overlay system unavailable
- Comprehensive error handling and logging

### Removed
- Direct OBS API dependency (now uses unified overlay)
- Static browser source requirement
- Hard-coded alert layouts

### Fixed
- Alert overlap issues with queue management
- Memory leaks from persistent event listeners
- Configuration not being properly applied

### Migration Guide
Users upgrading from v1.0.x:
1. Remove old OBS browser source (no longer needed)
2. Module now works automatically with Core's unified overlay
3. Configuration settings preserved and compatible
4. Test alerts after upgrade to verify functionality

## [1.0.1] - 2025-10-16

### Fixed
- Improved OBS Control module integration
- Better error handling when OBS unavailable
- Configuration validation

## [1.0.0] - 2025-10-15

### Added
- Initial release
- 5 alert types: Follow, Subscribe, Raid, Donation, Cheer
- 5 animation styles
- Custom sound effects
- TTS support
- OBS browser source integration
- Basic configuration options
