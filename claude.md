# Claude AI Instructions - GothBot Module Marketplace

## Repository Context

This is the **official module marketplace** for [GothomationBot v2.0](https://github.com/GothUncc/gothomationbotV2). It serves as a centralized catalog registry where:

- Module developers submit their creations
- GothBot instances fetch the catalog to display available modules
- Users browse and install modules directly from the bot's admin panel

## Repository Structure

```
gothbot-modules/
├── catalog.json                      # Module registry database
├── README.md                         # Public-facing marketplace documentation
├── architecture.md                   # Module development guide & system architecture
├── claude.md                         # This file - AI assistant instructions
└── MODULE_36_IMPLEMENTATION_PLAN.md  # OBS Control module implementation plan
```

## Key Files

### catalog.json
The single source of truth for all marketplace modules. Each entry contains:
- Module metadata (id, name, version, description, author)
- Category and tags for discovery
- Download URL and install type
- Requirements (bot version, framework version)
- Documentation links
- Verification status (official/verified flags)

### README.md
User-facing documentation covering:
- Available modules showcase
- Installation instructions
- Module developer submission guidelines
- Module entry format specification

### architecture.md
Technical guide for module developers containing:
- GothBot module system architecture
- Step-by-step module creation instructions
- API reference and event system
- Best practices and security guidelines

## Working with This Repository

### Adding New Modules
1. Review the module submission in detail
2. Validate against the schema in README.md
3. Add entry to catalog.json in alphabetical order by ID
4. Update README.md "Available Modules" section
5. Increment catalog.json version if needed
6. Update lastUpdated timestamp

### Module Entry Requirements
- Valid semver version
- Proper category (overlay|integration|chat|automation|analytics|utility)
- Appropriate tags for discovery
- Accessible downloadUrl
- Documentation links that work
- Correct botVersion requirement format (>=X.Y.Z)
- official: true only for GothBot Team modules
- verified: true only after review process

### Version Management
- catalog.json has its own version (currently 1.0.1)
- Individual modules have independent versions
- Update catalog version on breaking schema changes
- Increment patch version (x.x.X) when adding new modules
- Increment minor version (x.X.0) when changing module schema
- Increment major version (X.0.0) for breaking changes

## AI Assistant Guidelines

### When Reviewing Module Submissions
1. Verify all required fields are present
2. Check URLs are accessible (documentation, repository, downloadUrl)
3. Validate version formats (semver)
4. Ensure category matches allowed values
5. Verify requirements.botVersion format
6. Check for duplicate module IDs
7. Validate JSON syntax

### When Creating Documentation
- Keep instructions clear and concise
- Include code examples where appropriate
- Reference the main GothomationBot v2 repository for implementation details
- Maintain consistency with existing documentation style

### When Updating catalog.json
- Maintain alphabetical order by module ID
- Update lastUpdated timestamp to current ISO 8601 format
- Preserve JSON formatting (2-space indent)
- Keep modules array well-organized

## Related Repositories

- **GothomationBot v2**: https://github.com/GothUncc/gothomationbotV2
  - Main bot codebase
  - Module system implementation
  - Example modules (modules/ directory)
  - MODULE_SYSTEM.md - Complete module framework documentation

## Current State

- **Catalog Version**: 1.0.1
- **Total Modules**: 2 (OBS Control, Alert System)
- **Last Updated**: 2025-11-08
- **Repository Status**: Active development, expanding module ecosystem

## Available Modules

### Infrastructure Modules
1. **obs-control** (v1.0.0) - OBS Control & Dynamic Overlays
   - Foundation module for all OBS integration
   - Dynamic alert engine, automation, scene management
   - Required by: alerts module (future v2.0)

### Overlay Modules
2. **alerts** (v1.0.0) - Alert System (Proof of Concept)
   - Multi-platform stream alerts
   - Will be superseded by alerts v2.0 using obs-control

## Development Workflow

### Local Development
When developing modules locally (on Windows dev machine):
1. Create module in `GothOmationBot2.0/modules/module-name/`
2. Test locally with `npm run dev`
3. Commit to GothBot repository
4. Add to `catalog.json` in this repository
5. Update `README.md` with module details
6. Test module appears in marketplace

### Production Deployment
GothBot runs on production Unraid server:
1. Push code to GitHub from local dev machine
2. Pull latest on Unraid server
3. Restart GothBot container
4. Module marketplace updates automatically

## Module Categories

- **infrastructure** - Core system modules (OBS Control, AI Framework)
- **overlay** - Stream overlays (Alerts, Goal Tracker, Chat Overlay)
- **integration** - External service integrations (Discord, Spotify, Fourthwall)
- **chat** - Chat commands and interactions
- **automation** - Automated tasks and workflows
- **analytics** - Stats, tracking, and reporting
- **utility** - Helper tools and utilities

## Priority Modules in Development

Based on issue analysis and dependencies:
1. ✅ **#36 OBS Control** - Complete (Phase 1)
2. **#37 AI/ML Framework** - Foundation for AI modules
3. **#4 Chat Commands** - Foundation for chat-based features
4. **#10 Stream Markers** - Quick win, content creator value
5. **Alert System v2.0** - Rewrite using OBS Control

## Notes for AI Assistants

### Module Development Pattern
When building new modules, follow this pattern:
1. Use wrapping approach for existing services (like OBS Control wraps OBSMasterCore)
2. Create comprehensive documentation (README.md, QUICKSTART.md)
3. Include configuration schema in package.json
4. Expose public API via `context.moduleApi` for other modules
5. Implement proper lifecycle hooks (initialize, start, stop, shutdown)

### Testing Before Production
- Always test locally before pushing to production server
- Use `npm run dev` for local testing
- Verify module loads and connects properly
- Test module interactions and dependencies
- Check logs for errors or warnings

### Git Workflow
Two repositories to manage:
1. **gothbot-modules** - Marketplace catalog (this repo)
2. **gothomationbotV2** - Main bot code and module implementations

Both must be updated and pushed for new modules to appear.
