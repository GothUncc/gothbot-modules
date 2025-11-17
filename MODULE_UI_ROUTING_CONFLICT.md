# Module Web UI Routing Conflict - CRITICAL

**Date**: 2025-11-11T16:15:00Z  
**Status**: BLOCKING DEPLOYMENT  
**Severity**: CRITICAL  
**Affected Module**: obs-master-control v2.4.0  
**Core System**: GothomationBot v2.0.192+

---

## Executive Summary

The OBS Master Control module's web UI is **not accessible** despite:
- ✅ Module implementing `context.web.serveStatic('/', './build')` correctly (line 1582)
- ✅ Module dashboard button appearing in admin panel (catalog v1.0.10 fix)
- ✅ Button linking to correct URL (`/modules/obs-master-control/`)

**Problem**: Admin panel routing is intercepting module web UI routes, preventing access to the SvelteKit dashboard.

---

## Problem Description

### What Should Happen
1. User clicks "🌐 Open Dashboard" button in admin panel
2. Browser navigates to `/modules/obs-master-control/`
3. Core system routes request to module's `context.web` router
4. Module serves SvelteKit static files from `./build` directory
5. User sees OBS Master Control dashboard with tabs, controls, real-time updates

### What Actually Happens
1. User clicks "🌐 Open Dashboard" button
2. Browser navigates to `/modules/obs-master-control/`
3. **Admin panel router intercepts request** (takes priority)
4. Admin panel shows module configuration page instead
5. SvelteKit dashboard never loads

### Attempting Direct Access
- URL: `gothbot.kusalab.org/modules/obs-master-control/index.html`
- Result: **404 Not Found**
- Meaning: Module's static file server never receives the request

---

## Root Cause: Route Registration Order

The core system has **two competing route handlers** for the same URL pattern:

### Handler 1: Admin Panel (Currently Winning)
```typescript
// Registered in admin panel router
// Pattern: /modules/:moduleId
// Purpose: Show module configuration/settings page
app.get('/modules/:moduleId', (req, res) => {
  // Renders admin panel view with module details
  res.render('module-config', { moduleId: req.params.moduleId });
});
```

### Handler 2: Module Web UI (Being Blocked)
```typescript
// Registered by module runtime when module has context.web
// Pattern: /modules/:moduleId/*
// Purpose: Serve module's web UI files
context.web.serveStatic('/', './build');
// Should map to: /modules/obs-master-control/* → serve from build/
```

**The Problem**: Handler 1 is registered **before** Handler 2, or Handler 1's pattern is matching first because it's more general.

---

## Evidence

### 1. Module Implementation is Correct

**File**: `modules/obs-control/index.js` (Line 1582)
```javascript
// Module correctly registers web UI
if (context.web) {
  context.web.serveStatic('/', './build');
  context.logger.info(`OBS Master Control UI available at ${context.web.getBaseUrl()}`);
}
```

This should create a route handler for `/modules/obs-master-control/*` that serves files from the `./build` directory.

### 2. Button Links to Correct URL

**Frontend HTML**:
```html
<a href="/modules/obs-master-control/" 
   class="... bg-goth-purple ...">
  🌐 Open Dashboard
</a>
```

The button is correctly constructed with the right URL.

### 3. Admin Panel Intercepts Request

**Observed Behavior**:
- Navigate to `/modules/obs-master-control/`
- Page shows: "OBS Master Control Panel" admin config view
- URL in address bar: `gothbot.kusalab.org/modules/obs-master-control`
- Content: Module settings (Disable, Reload, Uninstall buttons)

### 4. Direct File Access Returns 404

**Test**:
- Navigate to `/modules/obs-master-control/index.html`
- Result: **404 Not Found**
- Expected: Should serve `build/index.html` from module directory
- Actual: Request never reaches module's static file server

---

## Solution: Fix Route Registration Priority

### Option 1: Change Admin Panel Routes (RECOMMENDED)

Move admin panel module management to a distinct path to avoid conflicts:

**Current**:
```typescript
app.get('/modules/:moduleId', showModuleConfig);
```

**Fixed**:
```typescript
app.get('/admin/modules/:moduleId', showModuleConfig);
// OR
app.get('/manage/modules/:moduleId', showModuleConfig);
```

**Impact**:
- Admin panel links need updating: `/modules/X` → `/admin/modules/X`
- Module web UIs remain at `/modules/X` (no change needed)
- Clear separation: `/admin/modules/*` = management, `/modules/*` = UIs

### Option 2: Register Module Routes First

Ensure module web UI routers are mounted **before** admin panel routes:

**File**: `src/server.ts` or main Express app setup

**Current (Problematic) Order**:
```typescript
// Admin routes registered first (wins)
app.use('/admin', adminRouter);

// Module routes registered later (blocked)
moduleRuntime.mountWebRoutes(app);
```

**Fixed Order**:
```typescript
// Module routes FIRST (higher priority)
moduleRuntime.mountWebRoutes(app);

// Admin routes SECOND (fallback)
app.use('/admin', adminRouter);
```

### Option 3: Use More Specific Admin Route Pattern

Make admin route pattern more specific so it doesn't match module UI paths:

```typescript
// Before: Matches everything
app.get('/modules/:moduleId', showModuleConfig);

// After: Only matches without trailing slash or with specific admin paths
app.get('/modules/:moduleId/config', showModuleConfig);
app.get('/modules/:moduleId/settings', showModuleConfig);
// Module UI routes (with trailing slash) won't match
```

---

## Implementation Guide

### Step 1: Identify Route Registration Code

**Find where admin panel routes are registered**:
```bash
grep -r "'/modules/:moduleId'" src/
grep -r "router.get.*modules" src/
```

**Find where module web routes are mounted**:
```bash
grep -r "mountWebRoutes\|registerWebRouter" src/core/modules/
```

### Step 2: Apply Fix (Option 1 Recommended)

**File**: `src/routes/admin.ts` (or wherever admin module routes are)

**Before**:
```typescript
router.get('/modules/:moduleId', async (req, res) => {
  const module = await getModule(req.params.moduleId);
  res.render('module-config', { module });
});
```

**After**:
```typescript
router.get('/admin/modules/:moduleId', async (req, res) => {
  const module = await getModule(req.params.moduleId);
  res.render('module-config', { module });
});
```

### Step 3: Update Admin Panel Links

**File**: `frontend/src/routes/modules/+page.svelte` (or module list component)

Update all links that point to module config pages:

**Before**:
```svelte
<a href="/modules/{module.moduleId}">Configure</a>
```

**After**:
```svelte
<a href="/admin/modules/{module.moduleId}">Configure</a>
```

### Step 4: Verify Module Router is Mounted

**File**: `src/server.ts` or `src/core/modules/ModuleRuntime.ts`

Ensure module web UI routes are properly mounted:

```typescript
// After modules are loaded
for (const [moduleId, moduleInstance] of loadedModules) {
  if (moduleInstance.context.web) {
    // Mount module's web router at /modules/{moduleId}
    app.use(`/modules/${moduleId}`, moduleInstance.context.web.router);
  }
}
```

---

## Testing Checklist

After implementing fix:

- [ ] Navigate to `/modules/obs-master-control/`
  - Should show SvelteKit dashboard (tabs, controls, status)
  - Should NOT show admin config page

- [ ] Navigate to `/modules/obs-master-control/index.html`
  - Should serve `build/index.html`
  - Should NOT return 404

- [ ] Navigate to `/admin/modules/obs-master-control` (new path)
  - Should show module configuration page
  - Should have Disable, Reload, Uninstall buttons

- [ ] Click "🌐 Open Dashboard" button in admin panel
  - Should navigate to `/modules/obs-master-control/`
  - Dashboard should load successfully

- [ ] Test module UI functionality
  - Connection status updates in real-time
  - Profile switcher works
  - Scene collection switcher works
  - All tabs accessible (Dashboard, Profiles, Collections, etc.)

---

## Alternative Workaround (Temporary)

If route changes require extensive refactoring, consider this temporary fix:

**Add explicit check in admin route handler**:

```typescript
router.get('/modules/:moduleId', async (req, res, next) => {
  const module = await getModule(req.params.moduleId);
  
  // If module has web UI and request is for UI (not config), pass to next handler
  if (module.hasUI && req.path === `/modules/${req.params.moduleId}/`) {
    return next(); // Let module's web router handle it
  }
  
  // Otherwise show admin config page
  res.render('module-config', { module });
});
```

But this is **not recommended** - proper path separation is cleaner.

---

## Expected Behavior After Fix

```
User clicks "🌐 Open Dashboard"
  ↓
Browser navigates to /modules/obs-master-control/
  ↓
Express router checks handlers in order:
  1. Module web routes (/modules/obs-master-control/*) ← MATCHES
  2. Admin routes (/admin/modules/:moduleId) ← Skipped
  ↓
Module's context.web router receives request
  ↓
context.web.serveStatic serves build/index.html
  ↓
SvelteKit app loads in browser
  ↓
Dashboard displays with all UI components working
```

---

## Files to Modify

### Backend
1. **Admin Routes** (`src/routes/admin.ts` or similar)
   - Change `/modules/:moduleId` → `/admin/modules/:moduleId`

2. **Server Setup** (`src/server.ts`)
   - Ensure module routes mounted before admin routes

3. **Module Runtime** (`src/core/modules/ModuleRuntime.ts`)
   - Verify `context.web` routers are properly mounted

### Frontend
1. **Module List** (`frontend/src/routes/modules/+page.svelte`)
   - Update config page links: `/modules/X` → `/admin/modules/X`

2. **Module Card** (`frontend/src/lib/components/modules/ModuleCard.svelte`)
   - Verify "Open Dashboard" uses `module.uiPath` (already correct)
   - Update "Configure" button to `/admin/modules/{moduleId}`

---

## Impact Assessment

**Scope**: Core system routing architecture  
**Risk**: MEDIUM (requires careful testing of admin panel links)  
**Benefit**: Unblocks all module web UIs (current and future)  
**Breaking Changes**: Admin panel URLs change (can be mitigated with redirects)

---

## Related Issues

- CORE_SYSTEM_BUG_REPORT_DASHBOARD_BUTTON.md (database metadata - related but separate)
- CATALOG_HASUI_ISSUE.md (catalog metadata - RESOLVED)
- DASHBOARD_BUTTON_ROUTING_ISSUE.md (this diagnosis - supersedes that doc)

---

## Success Criteria

✅ **Fix is successful when:**

1. Navigate to `/modules/obs-master-control/` → Shows OBS dashboard (not config page)
2. Navigate to `/admin/modules/obs-master-control` → Shows config page
3. Click "Open Dashboard" button → Loads functional SvelteKit UI
4. All 9 dashboard components render correctly
5. WebSocket connection establishes for real-time updates
6. No 404 errors when accessing module UI assets

---

## Next Steps for GothomationBot Core Team

1. **Decide on solution**: Option 1 (recommended), Option 2, or Option 3
2. **Identify affected code**: Search for `/modules/:moduleId` route definitions
3. **Implement changes**: Update route patterns and links
4. **Add redirects** (optional): `/modules/X` → `/admin/modules/X` for backwards compatibility
5. **Test thoroughly**: Verify both admin panel and module UIs work
6. **Deploy**: Roll out fix to production

---

**Priority**: HIGH - Blocks Phase 5 deployment of OBS Master Control  
**Estimated Effort**: 1-2 hours (clean separation approach)  
**Assigned**: GothomationBot Core Development Team

---

## Additional Context for Core Team

The module side is **100% complete and verified**:
- ✅ Module implements `context.web` API correctly
- ✅ SvelteKit build exists in `./build` directory (174 files)
- ✅ Routes registered via `context.web.registerRoute()` (7 API endpoints)
- ✅ Static files registered via `context.web.serveStatic('/', './build')`
- ✅ Catalog has correct metadata (`hasUI: true`, `ui.entrypoint: "/"`)
- ✅ Dashboard button appears and links correctly

**This is purely a core system routing issue** - no module changes needed.

The module is ready to serve its UI as soon as the route conflict is resolved. Direct the request to the module's router, and the dashboard will work immediately.

---

**We're looking forward to working together to resolve this!** The module team has done everything correctly on our side. Once the routing is fixed, the full Phase 5 OBS Master Control dashboard will be available to users. Let us know if you need any clarification or additional information. 🤝
