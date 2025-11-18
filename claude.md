# GOTHBOT MODULES - AI CONTEXT (MACHINE-READABLE)

<!--
🚨 CRITICAL REPOSITORY POLICY 🚨
GOTHOMATIONBOTV2 IS READ-ONLY FROM THIS WORKSPACE
- This workspace (gothbot-modules) is for module development ONLY
- The GothOmationBot2.0 core system is NEVER to be modified from here
- The GothOmationBot2.0 repo is visible for reference/dependency checking ONLY
- VIOLATION = Reverting changes and blocking commits
- If changes are needed in core, they MUST be made in the GothOmationBot2.0 workspace directly
- DO NOT: Copy code FROM GothOmationBot2.0 and modify it here (creates conflicts)
- DO NOT: Edit anything in the GothOmationBot2.0 directory structure
- DO NOT: Commit any changes that would affect the core system

AI FORMATTING RULES (CRITICAL):
1. NO prose/paragraphs - use lists, key:value, compact syntax
2. NO emojis, headers with icons, or decorative elements
3. NO redundant explanations - state facts once
4. UPDATE existing entries in-place, do NOT append duplicates
5. USE ISO 8601 timestamps (2025-11-09T20:30:00Z)
6. RECENT_CHANGES: Keep last 5 versions only, remove older
7. When adding new info, find appropriate section or create new compact section
8. This document is for AI context retrieval - optimize for tokens, not human readability

AI IMPLEMENTATION RULES (CRITICAL):
1. NEVER implement placeholder/stub code without explicit user permission
2. NEVER create mock/fake functionality that appears to work but doesn't
3. NEVER build UI components without implementing actual backend functionality
4. ALWAYS verify dependencies are available before implementing features
5. ALWAYS disclose to user if functionality requires external services/APIs
6. If backend service unavailable, inform user IMMEDIATELY - do not proceed with stubs
7. Implementation must be complete and functional OR clearly documented as incomplete

AI COLLABORATION PROTOCOL:
- Cross-workspace coordination: C:\Users\malik\OneDrive\Documents\AICollaboration\
- ModAI (this workspace) ↔ CoreAI (GothomationBot2.0 workspace)
- Communication files: Machine-readable markdown, token-optimized
- Format: Issue ID, evidence, root cause, solution options, file locations
- NO human prose, use compact key:value, lists, code snippets only
- Prefix files: MOD_TO_CORE_* or CORE_TO_MOD_*
- Update collaboration files, do NOT create duplicates
- Cross-reference by filename when responding

🚨 CRITICAL MODULE ARCHITECTURE IMPERATIVE 🚨
EVERY MODULE MUST EXPOSE ALL PUBLIC FUNCTIONS VIA MODULE API
- Modules are NOT standalone silos - they are interconnected components
- ALL modules MUST expose their functionality for other modules to consume
- Use context.registerApi(name, apiObject) to expose functions
- Other modules access via context.getApi(moduleName)
- NO private-only modules - interoperability is MANDATORY
- Example: Alert module exposes showAlert(), Chat module exposes sendMessage()
- This enables: Automation workflows, cross-module triggers, ecosystem integration
- Violation: Module will be rejected from marketplace
- Test interoperability BEFORE marking module complete
-->

## META
- Updated: 2025-11-17T07:30:00Z
- Version: 1.0.22
- Status: MODULE_MARKETPLACE_CATALOG
- Repo: https://github.com/GothUncc/gothbot-modules
- Core: https://github.com/GothUncc/gothomationbotV2
- Purpose: Official module marketplace/registry for GothomationBot v2.0
- Install: GothBot instances fetch catalog.json to display available modules in admin panel

## SYSTEM
- Module marketplace: Centralized catalog registry
- Format: JSON catalog with module metadata
- Module categories: overlay, integration, chat, automation, analytics, utility
- Schema version: 1.0.1 (catalog.json)
- Module versioning: Semver (independent from catalog version)
- Discovery: Tags, category filtering
- Installation: Direct from bot's admin panel (catalog URL)
- Documentation: README.md (submission guide), architecture.md (dev guide)

## REPOSITORY_STRUCTURE
catalog.json - Module registry database (single source of truth)
README.md - Public marketplace documentation & submission guidelines
architecture.md - Module development guide & system architecture
claude.md - This file - AI assistant context
MODULE_36_IMPLEMENTATION_PLAN.md - OBS Control module implementation notes
CATALOG_HASUI_ISSUE.md - Catalog hasUI field issue (RESOLVED v1.0.10)
CORE_SYSTEM_BUG_REPORT_DASHBOARD_BUTTON.md - Core system bug preventing dashboard button display

## CATALOG.JSON_SCHEMA
Module entry fields:
- id: unique identifier (kebab-case)
- name: display name
- version: semver format (X.Y.Z)
- description: short description
- author: creator name
- category: overlay|integration|chat|automation|analytics|utility
- tags: array for discovery
- downloadUrl: accessible URL to module code/package
- repository: source code repository
- documentation: link to module docs
- requirements.botVersion: format >=X.Y.Z
- official: boolean (true = GothBot Team only)
- verified: boolean (true = after review process)
- lastUpdated: ISO 8601 timestamp

## WORKING_WITH_MODULES

### Adding New Modules
1. Validate all required fields present
2. Check URLs accessible (docs, repo, download)
3. Validate semver version format
4. Verify category in allowed list
5. Add entry in alphabetical order by ID to catalog.json
6. Update README.md Available Modules section
7. Update catalog.json lastUpdated timestamp
8. Increment patch version (x.x.X) for module additions
9. Validate JSON syntax

### Version Management
- catalog.json: Own version (1.0.1), incremented on schema changes
- Modules: Independent semver versions
- Patch bump (x.x.X): Adding new modules
- Minor bump (x.X.0): Changing module schema
- Major bump (X.0.0): Breaking changes to catalog format

### Validation Checklist
- All required fields present
- URLs accessible/valid
- Semver format correct
- Category in: overlay, integration, chat, automation, analytics, utility
- botVersion format: >=X.Y.Z
- official: true only for GothBot Team
- verified: true only after review
- No duplicate IDs
- JSON formatting valid (2-space indent)

## FILES

### README.md
- Available modules showcase
- Installation instructions
- Module developer submission guidelines
- Entry format specification
- How to submit/request modules

### architecture.md
- GothBot module system architecture
- Module creation step-by-step guide
- ModuleRuntime API reference
- ModuleContext API (context.overlay, context.obsApi, context.storage, context.events)
- Event system documentation
- Best practices & security guidelines
- Sandbox limitations (5s timeout, 128MB)

### catalog.json
- Single source of truth for all modules
- Module metadata: name, version, category, tags
- Requirements: bot version compatibility
- URLs: download, repository, documentation
- Verification status: official/verified flags
- Last updated timestamp

## MODULE_API_CONTEXT
(From core GothomationBot v2)

### Module Runtime
- Sandbox: 5s timeout, 128MB memory limit (by design)
- Execution: Hot-loaded eval sandbox with timeout enforcement
- Error handling: Must handle timeouts gracefully
- Dependencies: Access via context object only

### Module Context API
context.overlay.showAlert({title, message, icon, duration, position, variant})
context.overlay.showText({text, fontSize, color, backgroundColor, duration, position, animation})
context.overlay.showElement(id, html, {position, duration, zIndex})
context.overlay.hideElement(id)
context.overlay.clear()
context.obsControl.* // OBS Master Control Panel - 174+ methods across 14 controllers (audio, streaming, recording, sceneItems, filters, transitions, scenes, sources, automation, virtualCam, replayBuffer, profiles, sceneCollections, videoSettings)
context.storage.* // Persistent key-value storage
context.events.* // Event subscriptions & publishing
context.web.registerRoute(method, path, handler) // Register HTTP routes (GET/POST/PUT/DELETE)
context.web.serveStatic(urlPath, localPath) // Serve static UI files
context.web.getBaseUrl() // Get module's web UI base URL (/modules/{moduleId})

### MODULE INTEROPERABILITY API (MANDATORY)
🚨 ALL MODULES MUST EXPOSE PUBLIC FUNCTIONS 🚨

Registration (in module's initialize() function):
context.registerApi('moduleName', {
  functionName: async (param1, param2) => { /* implementation */ },
  anotherFunction: (data) => { /* implementation */ }
});

Consumption (from other modules):
const alertApi = context.getApi('alerts');
if (alertApi) {
  await alertApi.showAlert({ type: 'follow', username: 'viewer' });
}

Required exports per module type:
- Alerts: showAlert(), clearQueue(), getQueue(), testAlert()
- Chat: sendMessage(), deleteMessage(), timeout(), ban(), getModerators()
- Overlay: showElement(), hideElement(), updateElement(), clearOverlay()
- Audio: playSound(), stopSound(), setVolume(), getSounds()
- Points: addPoints(), removePoints(), getBalance(), getLeaderboard()
- Commands: registerCommand(), unregisterCommand(), executeCommand(), getCommands()
- Goals: createGoal(), updateProgress(), completeGoal(), getGoals()
- Automation: createRule(), deleteRule(), executeRule(), getRules()

Discovery:
context.listAvailableApis() // Returns array of registered module API names

Best practices:
- Use async functions for I/O operations
- Return success/error objects: {success: boolean, data?: any, error?: string}
- Validate parameters before execution
- Log API calls for debugging: context.logger.info('API called', {module, function, params})
- Document all public functions in module README
- Version your API: Include breaking changes in major version bumps

### Event Types
50+ event types from Twitch/Kick/YouTube platforms
Normalized event format across platforms
WebSocket broadcast to frontend
120 day retention policy

## CRITICAL_LEARNINGS
- Module IDs must be unique and never reused
- Schema validation crucial before catalog.json update
- Webhook verification: Middleware order matters in core
- URLs must be accessible/valid (test before adding)
- Semver versioning non-negotiable for compatibility
- Documentation links validated on submission review
- Categories must match allowed enum values exactly
- official flag reserved for GothBot Team only
- Module sandboxing enforced: 5s timeout, 128MB limit
- Module web UI support: Core now provides context.web API for HTTP routes and static file serving
- Web UI modules: Routes namespaced under /modules/{moduleId}, authentication inherited from bot
- Feature request pattern: Document blockers (FEATURE_REQUEST_MODULE_WEB_UI.md) before core changes
- Dashboard button visibility: Requires hasUI: true in catalog.json (v2.0.192+)
- Dashboard metadata: uiPath and ui object with title, description, entrypoint, icon fields required
- Module implementation must use context.web.serveStatic() and context.web.registerRoute() for UI
- Module dashboard URLs: Use relative paths + context.web.getBaseUrl() for compatibility
- Core v2.0.209+: Module UIs served at /module-ui/:id (not /modules/:id/)
- Admin config remains at /modules/:id (SvelteKit route)

## KNOWN_ISSUES
- Core System: Static middleware intercepts API routes (v0.9.7-0.9.11)
  - Status: RESOLVED v2.0.209 - Core changed URL pattern, module updated v0.9.12
  - Root cause: serveStatic() created catch-all under /modules/ path
  - After 5 failed attempts (trailing slash logic), Core chose complete URL separation
  - Solution: Module dashboards at /module-ui/:id, admin config at /modules/:id
  - Module fix: Changed API_PREFIX from /modules/obs-master-control to /module-ui/obs-master-control
  - Documentation: MOD_TO_CORE_ROUTING_CONFLICT.md, CORE_TO_MOD responses
- Core System: Module serving path changes require container restart
  - Status: LIMITATION - Express middleware chain behavior
  - Root cause: Old routers not unmounted when modules reload, shadow new routes
  - Impact: Changing context.web.serveStatic() path requires full container restart to apply
  - Documentation: CORE_ANALYSIS_WEB_SERVESTATIC.md
  - Workaround: Container restart clears middleware chain, fresh routes registered
  - Future fix: CoreAI to implement router tracking/unmounting in ModuleRuntime
- Core System: Module static file serving (IN PROGRESS - v2.0.206+)
  - Status: SOLUTION_IDENTIFIED - File extraction system pending Core implementation
  - Root cause: Module files stored in database, not filesystem; serveStatic() can't find files
  - Solution: Core to extract module files to filesystem during installation (Option 2 - file manifest)
  - ModAI status: COMPLETE - files manifest added to package.json (commit de6568f)
  - Core status: Phases 1-3 implementation pending
  - Documentation: CORE_TO_MOD_ARCHITECTURE_ANSWERS.md, MOD_TO_CORE_IMPLEMENTATION_READY.md
  - Timeline: 2-3 hours for Core deployment, then dashboard UI functional

## RECENT_CHANGES

### v1.0.22 (2025-11-17T07:30)
- OBS Master Control v0.9.12: Core v2.0.209 URL pattern compatibility
- Issue: Static middleware intercepted API routes (v0.9.7-0.9.11) - ALL requests got HTML instead of JSON
- Core fix: Moved module dashboards from /modules/:id to /module-ui/:id (complete URL separation)
- Module fix: Updated API_PREFIX from /modules/obs-master-control to /module-ui/obs-master-control
- File changed: routes/+page.svelte (line 8), rebuilt UI with new prefix
- Collaboration: MOD_TO_CORE_ROUTING_CONFLICT.md → Core responded with v2.0.209 changes
- Updated catalog version: 1.0.21 → 1.0.22, module: 0.9.11 → 0.9.12
- Status: DEPLOYED - Module now compatible with Core v2.0.209+

### v1.0.21 (2025-11-17T06:40)
- OBS Master Control v0.9.11: Registration order fix (ineffective)
- Attempted fix: Moved registerAPIRoutes() before serveStatic()
- Result: No change - static middleware still intercepted API routes
- Root cause: serveStatic() creates catch-all behavior regardless of order
- Led to Core investigation and v2.0.209 architectural fix

### v1.0.10 (2025-11-11T15:50)
- OBS Master Control Module: Integrated v2.0.192+ dashboard visibility system
- Added: hasUI: true flag to catalog.json entry (enables dashboard button in admin panel)
- Added: uiPath: "/" to catalog.json entry (sets UI entrypoint)
- Added: ui object with title, description, entrypoint, icon (provides dashboard metadata)
- Verified: Module already implements context.web API (registerRoute, serveStatic, WebSocket)
- Updated catalog version: 1.0.9 → 1.0.10, timestamp: 2025-11-11T15:50:00Z
- Module implementation complete: All v2.0.192+ features integrated and functional
- ⚠️ Core System Bug Found: Dashboard button not appearing (see CORE_SYSTEM_BUG_REPORT_DASHBOARD_BUTTON.md)
- Bug Root Cause: Module installation doesn't extract hasUI/ui from package.json into database metadata
- Bug Impact: Backend API returns hasUI: false because database lacks these fields (frontend is ready)
- Bug Status: Documented for GothomationBot2.0 core system team to fix

### v1.0.9 (2025-11-10T22:45)
- OBS Master Control v2.4.0 released (Phase 5 complete - UI dashboard)
- Created 9 Svelte components: Dashboard, ConnectionStatus, ProfileSwitcher, CollectionSwitcher, VideoSettings, ReplayBufferControl, VirtualCamControl, AutomationBuilder, AlertTester
- Created 7 REST API endpoints: /api/obs/status, /api/obs/profiles, /api/obs/collections, /api/obs/video-settings, /api/obs/replay-buffer, /api/obs/virtual-camera, /api/obs/automation
- Created WebSocket server (hooks.server.js): Real-time event broadcasting, message routing, state monitoring
- Created OBS event monitor (obsMonitor.js): State polling, event capture, client broadcast
- Responsive design: Mobile-first (< 768px), Tablet (768-1024px), Desktop (> 1024px)
- Added comprehensive UI documentation: PHASE_5_UI_DOCUMENTATION.md (1,500+ lines)
- Added responsive design testing guide: PHASE_5_RESPONSIVE_DESIGN_TESTING.md
- Added complete test suite: Phase_5_Testing_Suite.js (unit, integration, E2E tests)
- Updated catalog.json: version 1.0.9, obs-master-control v2.4.0
- SvelteKit framework: Reactive components, state management, real-time sync
- Total new code: ~4,000 lines (components, API, WebSocket, tests, docs)

### v1.0.8 (2025-11-10T21:30)
- OBS Master Control v2.3.0 released (Phase 4 complete)
- Added VirtualCamController.js: 11 methods for virtual camera control
- Added ReplayBufferController.js: 12 methods for replay buffer management
- Added ProfileController.js: 11 methods for OBS profile switching
- Added SceneCollectionController.js: 12 methods for scene collection management
- Added VideoSettingsController.js: 16 methods for video settings control
- Updated catalog.json: obs-master-control v2.3.0 entry, 174+ methods, 14 controllers
- Created PHASE_4_IMPLEMENTATION.md: Complete Phase 4 documentation
- Virtual camera: start/stop/toggle, format selection (UYVY, NV12, I420, XRGB, ARGB)
- Replay buffer: save clips, status monitoring, configurable duration (5-3600s)
- Profiles: create, delete, switch, clone profiles with metadata
- Scene collections: switch, duplicate, export collections
- Video settings: resolution/FPS/format control, presets (480p-4K), scaling

### v1.0.7 (2025-11-10T20:00)
- OBS Master Control v2.2.0 released (Phase 3 complete)
- Added FilterController.js: 17 methods for filter management
- Added TransitionController.js: 20 methods for transitions & studio mode
- Updated catalog.json: obs-master-control v2.2.0 entry
- Total: 114+ API methods across 9 controllers
- Filter control: create, remove, enable/disable, configure, reorder
- Transition control: select, duration, settings, progress monitoring
- Studio mode: preview to program, T-bar control, animated transitions

## AI_ASSISTANT_GUIDELINES

### When Adding Modules to catalog.json
1. Validate all required fields present
2. Check URLs are accessible
3. Verify version format (semver)
4. Ensure category valid
5. Check for duplicate IDs
6. Maintain alphabetical order by ID
7. Update lastUpdated timestamp
8. Preserve JSON formatting (2-space)
9. Increment patch version if needed
10. Validate JSON syntax before final commit

### When Creating Documentation
- Keep clear and concise (token optimization)
- Include code examples for implementation
- Reference core GothomationBot v2 for API details
- Maintain consistency with existing style
- No prose/paragraphs - use lists/key:value format
- Link to relevant architecture sections

### When Reviewing Submissions
1. All required fields present & formatted correctly
2. URLs validated (accessibility check)
3. Semver version format correct
4. Category matches allowed enum
5. botVersion requirement format valid (>=X.Y.Z)
6. No duplicate module IDs
7. JSON syntax valid
8. Documentation comprehensive
9. official/verified flags appropriate
10. Module adheres to 5s timeout, 128MB sandbox limits

## RELATED_REPOS
- Core: https://github.com/GothUncc/gothomationbotV2 (v2.0.191)
- Modules: https://github.com/GothUncc/gothbot-modules
- Deploy: Docker Hub (gothuncc/gothomationbot)
- Platform: https://gothbot.kusalab.org (Unraid container)
  - Main bot codebase
  - Module system implementation
  - Example modules (modules/ directory)
  - MODULE_SYSTEM.md - Complete module framework documentation

## Current State

- **Catalog Version**: 1.0.11
- **Total Modules**: 2 (OBS Master Control Panel v2.4.0, Alert System v1.0.1)
- **Last Updated**: 2025-11-16T14:00:00Z
- **Core Compatibility**: v2.0.209+ (module-ui URL pattern)
- **Repository Status**: Active development, OBS Master Control Phase 5 fully deployable with context.web API

## Available Modules

### Infrastructure Modules
1. **obs-master-control** (v2.4.0) - OBS Master Control Panel
   - Complete OBS Studio remote control (audio, streaming, recording, transforms, filters, transitions, virtual cam, replay buffer, profiles, scene collections, video settings)
   - Audio mixer: volume, mute, balance, sync offset, monitoring (13 methods)
   - Stream controls: start, stop, stats, captions (8 methods)
   - Recording controls: start, stop, pause, split, chapters (14 methods)
   - Scene item transforms: position, scale, rotation, crop, bounds (27 methods)
   - Filter management: create, remove, enable/disable, configure, reorder (17 methods)
   - Transition control: select, duration, settings, progress (11 methods)
   - Studio mode: preview to program, T-bar control, animated transitions (9 methods)
   - Virtual camera: start, stop, format selection, broadcast control (11 methods)
   - Replay buffer: save clips, auto-capture, status monitoring (12 methods)
   - OBS profiles: create, delete, switch, clone, manage (11 methods)
   - Scene collections: switch, duplicate, export, organize (12 methods)
   - Video settings: resolution, FPS, format control, presets (16 methods)
   - 174+ OBS control methods across 14 controllers
   - Breaking change: context.obsApi → context.obsControl
   - Alert functionality removed (use core's context.overlay instead)
   - Phase 1, 2, 3, 4, 5 complete - Full web UI with SvelteKit dashboard deployed via context.web API

### Overlay Modules
2. **alerts** (v1.0.1) - Alert System
   - Multi-platform stream alerts
   - Needs update to use core's unified overlay system (context.overlay)

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
1. ✅ **#36 OBS Master Control v2.4.0** - ALL PHASES COMPLETE
   - ✅ Phase 1 (v2.0.0): Audio mixer, streaming controls, recording controls
   - ✅ Phase 2 (v2.1.0): Scene item transforms (position, scale, rotation, crop, bounds, visibility, locking, layering, blend modes)
   - ✅ Phase 3 (v2.2.0): Filters & transitions (filter management, transition control, studio mode, T-bar)
   - ✅ Phase 4 (v2.3.0): Advanced features (virtual cam, replay buffer, profile switching, scene collections, video settings) - 60 new methods
   - ✅ Phase 5 (v2.4.0): Web-based control panel UI - SvelteKit dashboard with 9 components, 7 REST endpoints, WebSocket server - DEPLOYED
2. **Alert System v2.0** - Rewrite to use context.overlay (core's unified overlay system)
3. **#37 AI/ML Framework** - Foundation for AI modules
4. **#4 Chat Commands** - Foundation for chat-based features
5. **#10 Stream Markers** - Quick win, content creator value

## Notes for AI Assistants

### Module Development Pattern
When building new modules, follow this pattern:
1. Use wrapping approach for existing services (like OBS Control wraps OBSMasterCore)
2. Create comprehensive documentation (README.md, QUICKSTART.md)
3. Include configuration schema in package.json
4. Expose public API via `context.moduleApi` for other modules
5. Implement proper lifecycle hooks (initialize, start, stop, shutdown)
6. For web UI modules: Use context.web API (registerRoute, serveStatic, getBaseUrl)
7. Web UI files: Build static assets, serve from module directory, routes auto-namespaced to /modules/{moduleId}

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
