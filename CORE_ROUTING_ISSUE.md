# CRITICAL: Core Routing Issue - Static Middleware Intercepting API Routes

**Date:** 2025-11-17  
**Severity:** CRITICAL  
**Module:** obs-master-control v0.9.11  
**Core Version:** v2.0.212  

## Problem Summary

When a module uses `context.web.serveStatic()` to serve a UI, the static file middleware is intercepting API routes registered via `context.web.registerRoute()`, even when:
1. API routes are registered BEFORE the static middleware
2. API routes use completely different path prefixes (`/api/obs/*` vs `/ui/*`)
3. The module explicitly mounts static files at `/ui` to avoid conflicts

## Expected Behavior

```javascript
// Module registration order:
context.web.registerRoute('GET', '/api/obs/scenes', handler);  // Should handle /modules/obs-master-control/api/obs/scenes
context.web.serveStatic('/ui', './build');                     // Should only handle /modules/obs-master-control/ui/*
```

**Expected:**
- `/modules/obs-master-control/api/obs/scenes` → Route handler returns JSON
- `/modules/obs-master-control/ui/index.html` → Static file middleware returns HTML

## Actual Behavior

**ALL requests under `/modules/obs-master-control/*` are being handled by the static middleware:**
- `/modules/obs-master-control/api/obs/scenes` → Returns `index.html` (404 fallback)
- `/modules/obs-master-control/api/obs/audio` → Returns `index.html` (404 fallback)
- `/modules/obs-master-control/api/obs/controls` → Returns `index.html` (404 fallback)
- `/modules/obs-master-control/api/obs/transitions` → Returns `index.html` (404 fallback)

**Browser Console Errors:**
```
Failed to load scenes: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
Failed to load audio: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
Failed to load controls: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
Failed to load transitions: SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

## Evidence from Logs

**Routes ARE being registered correctly:**
```
[debug]: Registered route: GET /modules/obs-master-control/api/obs/status
[debug]: Registered route: GET /modules/obs-master-control/api/obs/profiles
[debug]: Registered route: POST /modules/obs-master-control/api/obs/profiles
[debug]: Registered route: GET /modules/obs-master-control/api/obs/collections
[debug]: Registered route: POST /modules/obs-master-control/api/obs/collections
[debug]: Registered route: GET /modules/obs-master-control/api/obs/scenes
[debug]: Registered route: POST /modules/obs-master-control/api/obs/scenes
[debug]: Registered route: GET /modules/obs-master-control/api/obs/audio
[debug]: Registered route: POST /modules/obs-master-control/api/obs/audio
[debug]: Registered route: GET /modules/obs-master-control/api/obs/controls
[debug]: Registered route: POST /modules/obs-master-control/api/obs/controls
[debug]: Registered route: GET /modules/obs-master-control/api/obs/transitions
[debug]: Registered route: POST /modules/obs-master-control/api/obs/transitions
```

**But requests are hitting static middleware instead:**
```
[debug] [api-server]: GET /modules/obs-master-control/api/obs/scenes
[debug] [api-server]: Serving index.html from: /app/build/index.html {"requestPath":"/modules/obs-master-control/api/obs/scenes"}
[debug] [api-server]: GET /modules/obs-master-control/api/obs/audio
[debug] [api-server]: Serving index.html from: /app/build/index.html {"requestPath":"/modules/obs-master-control/api/obs/audio"}
```

## Root Cause Analysis

The static file middleware appears to have a **catch-all behavior** that:
1. Matches ANY path under the module's base path (`/modules/obs-master-control/*`)
2. Takes precedence over explicitly registered routes
3. Serves `index.html` as a fallback for non-existent paths (SPA routing)

This happens **regardless of registration order** - even when API routes are registered first.

## Attempted Workarounds (All Failed)

### Attempt 1: Separate Path Prefixes
- Moved static files to `/ui` subpath
- Kept API routes at `/api/obs/*`
- **Result:** Static middleware still intercepts `/api/obs/*`

### Attempt 2: Registration Order
- Registered API routes BEFORE calling `serveStatic()`
- **Result:** No change - static middleware still intercepts

### Attempt 3: Different Module Paths
- Changed from `serveStatic('/', './build')` to `serveStatic('/ui', './build')`
- Updated UI base path to `/module-ui/obs-master-control/ui`
- **Result:** UI loads correctly, but API calls still get HTML

## Impact

**This makes it IMPOSSIBLE for modules to have both:**
1. A web UI served via `context.web.serveStatic()`
2. API endpoints served via `context.web.registerRoute()`

**Current workaround:** None. The module is completely non-functional.

## Suggested Fixes (Core Team)

### Option 1: Route Priority System
Implement explicit priority for route registration:
```javascript
context.web.registerRoute('GET', '/api/obs/scenes', handler, { priority: 100 });
context.web.serveStatic('/ui', './build', { priority: 0 });
```

### Option 2: Strict Path Matching for Static Middleware
Make `serveStatic('/ui', './build')` ONLY match paths that start with `/ui/`:
- `/modules/obs-master-control/ui/*` → Static middleware
- `/modules/obs-master-control/api/*` → Route handlers
- `/modules/obs-master-control/anything-else` → 404 (not static fallback)

### Option 3: Middleware Scoping
Allow modules to explicitly scope middleware:
```javascript
context.web.serveStatic('/ui', './build', { 
  scope: 'exact',  // Only match /ui/* exactly, not catch-all
  fallback: false   // Don't serve index.html for non-UI paths
});
```

### Option 4: Separate API and UI Mount Points
Provide separate contexts:
```javascript
context.web.api.registerRoute('GET', '/scenes', handler);  // Mounts at /modules/obs-master-control/api/scenes
context.web.ui.serveStatic('./build');                      // Mounts at /module-ui/obs-master-control/
```

## Request for Core Team

**Please investigate the route resolution logic in Core's web server.**

Key areas to check:
1. How does `context.web.serveStatic()` register middleware?
2. What is the order of middleware execution?
3. Why do static file handlers take precedence over explicit route registrations?
4. Does the static middleware have a catch-all that should be scoped?

## Module Information

- **Module ID:** obs-master-control
- **Version:** 0.9.11
- **Repository:** https://github.com/GothUncc/gothbot-modules
- **File:** modules/obs-control/index.js (lines 1464-2367)
- **Routes Registered:** 35+ API endpoints
- **Static Mount:** `/ui` → `./build`

## Timeline of Issue

- **v0.9.1-0.9.7:** Implemented all functionality, discovered routing conflict
- **v0.9.8:** Fixed UI to call correct API paths with module prefix
- **v0.9.9:** Fixed static mount path to `/ui` to avoid conflicts
- **v0.9.10:** Updated module metadata with correct entrypoint
- **v0.9.11:** Changed registration order (API routes before static)
- **Current:** Still broken - static middleware intercepts everything

---

**This issue blocks the release of the OBS Master Control module** (51 API functions, complete UI, 2500+ lines of code). Without a fix to Core's routing system, modules cannot provide both UI and API functionality.

Please prioritize this issue. Happy to provide additional logs, test cases, or debugging assistance.

— AI Agent (GitHub Copilot) working with user on gothbot-modules
