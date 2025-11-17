# Dashboard Button Routing Issue - DIAGNOSIS

**Date**: 2025-11-11T16:00:00Z  
**Status**: NEW ISSUE  
**Severity**: HIGH  
**Affected Module**: obs-master-control v2.4.0

---

## Problem

✅ Dashboard button NOW APPEARS (catalog v1.0.10 fix worked!)  
❌ Button navigates to **module config page** instead of **module dashboard**

**Expected**: Click "Open Dashboard" → Navigate to `/modules/obs-master-control/`  
**Actual**: Click "Open Dashboard" → Navigate to module configuration page (probably `/admin/modules/obs-master-control`)

---

## Root Cause

The backend is likely **not constructing `uiPath` correctly** when it processes the catalog fallback data.

### Expected Backend Behavior

**File**: `src/api/routes/modules.ts` (lines ~90-100)

```typescript
if (hasUI) {
  const sanitizedEntrypoint = sanitizeUIEntrypoint(metadata.ui?.entrypoint);
  uiPath = `/modules/${module.moduleId}${sanitizedEntrypoint}`;
  // With entrypoint: "/" this should become: /modules/obs-master-control/
}
```

### What's Probably Happening

One of these scenarios:

**Scenario A**: Backend isn't reading catalog at all
- `hasUI` is coming from catalog fallback (working)
- But `ui.entrypoint` is NOT being read from catalog
- Result: `uiPath` remains undefined
- Frontend falls back to config page route

**Scenario B**: Backend reads catalog but doesn't construct `uiPath`
- `hasUI` is true from catalog
- But `uiPath` construction logic isn't running
- Frontend uses wrong fallback

**Scenario C**: Frontend button uses wrong href
- Backend sends correct `uiPath: "/modules/obs-master-control/"`
- But frontend button has wrong logic:
  ```svelte
  <!-- WRONG -->
  <a href="/admin/modules/{module.moduleId}">
  
  <!-- RIGHT -->
  <a href={module.uiPath || `/modules/${module.moduleId}`}>
  ```

---

## Diagnosis Steps

### Step 1: Check API Response

In browser DevTools, check the `/api/modules` response for `obs-master-control`:

```json
{
  "moduleId": "obs-master-control",
  "hasUI": true,  // ← Should be true (we see button, so this works)
  "uiPath": "???",  // ← CRITICAL: What value is this?
  "ui": {
    "entrypoint": "/",
    "title": "OBS Master Control"
  }
}
```

**Expected `uiPath`**: `"/modules/obs-master-control/"`  
**If undefined/wrong**: Backend catalog fallback logic incomplete

### Step 2: Check Backend Logs

Look for debug logs in backend:

```
[debug] [api-modules]: Found UI info for obs-master-control in catalog
[debug] [api-modules]: Constructed uiPath: /modules/obs-master-control/
```

**If missing second log**: Backend isn't constructing `uiPath` from catalog data

### Step 3: Check Frontend Button Element

In browser DevTools, inspect the "Open Dashboard" button:

```html
<!-- Expected -->
<a href="/modules/obs-master-control/">Open Dashboard</a>

<!-- If wrong -->
<a href="/admin/modules/obs-master-control">Open Dashboard</a>
```

---

## Solution Options

### Option 1: Fix Backend Catalog Fallback (Recommended)

**File**: `src/api/routes/modules.ts`

Ensure catalog fallback populates BOTH `hasUI` AND `ui` object:

```typescript
// When catalog fallback is used
if (catalogModule?.hasUI) {
  hasUI = true;
  uiConfig = catalogModule.ui;  // ← Make sure this is set
  
  // Construct uiPath from catalog data
  const sanitizedEntrypoint = sanitizeUIEntrypoint(catalogModule.ui?.entrypoint || '/');
  uiPath = `/modules/${module.moduleId}${sanitizedEntrypoint}`;
}
```

### Option 2: Fix Frontend Button (If Backend is Correct)

**File**: `frontend/src/lib/components/modules/ModuleCard.svelte`

Ensure button uses `module.uiPath` correctly:

```svelte
{#if module.hasUI}
  <a href={module.uiPath || `/modules/${module.moduleId}/`}>
    🌐 Open Dashboard
  </a>
{/if}
```

**Note**: Make sure fallback includes trailing slash: `/modules/${module.moduleId}/`

---

## Testing After Fix

1. Navigate to `/admin/modules`
2. Find OBS Master Control module card
3. Click "🌐 Open Dashboard" button
4. **Verify**: Browser navigates to `/modules/obs-master-control/`
5. **Verify**: SvelteKit dashboard loads (not config page)
6. **Verify**: Dashboard shows connection status, tabs, components

---

## Quick Workaround

If backend fix takes time, manually navigate to `/modules/obs-master-control/` in browser.

The dashboard UI is fully functional, just not linked correctly from the admin panel.

---

## Files Involved

### Backend
- `src/api/routes/modules.ts` (catalog fallback logic, lines ~80-125)

### Frontend  
- `frontend/src/lib/components/modules/ModuleCard.svelte` (button href)
- `frontend/src/routes/modules/+page.svelte` (module list page)

### Catalog
- `gothbot-modules/catalog.json` (has correct data: entrypoint: "/")

---

## Expected Behavior After Fix

```
User Action: Click "Open Dashboard" button
↓
Frontend: Reads module.uiPath = "/modules/obs-master-control/"
↓
Browser: Navigates to /modules/obs-master-control/
↓
Backend: Serves module's SvelteKit dashboard (context.web.serveStatic)
↓
Result: OBS Master Control dashboard loads with all UI components
```

---

## Related Issues

- CORE_SYSTEM_BUG_REPORT_DASHBOARD_BUTTON.md (button visibility - RESOLVED)
- CATALOG_HASUI_ISSUE.md (catalog metadata - RESOLVED)
- This issue: Button routing (NEW)

---

**Next Action**: Check `/api/modules` response in browser DevTools to see what `uiPath` value is being returned for `obs-master-control`.
