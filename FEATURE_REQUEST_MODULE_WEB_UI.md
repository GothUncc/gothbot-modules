# Feature Request: Module Web UI Support

**Date**: November 10, 2025  
**Requestor**: GothBot Development Team  
**Priority**: High  
**Scope**: Core System Enhancement

---

## Problem Statement

The GothBot module system currently does NOT provide a way for modules to register web-based user interfaces. Modules can only:
- React to events
- Store data in database
- Expose programmatic APIs to other modules
- Use OBS/Overlay APIs

**Limitation**: There is no mechanism for modules to serve HTML/JavaScript UI that users can interact with through a web browser.

---

## Use Case: OBS Master Control Module

The OBS Master Control module (v2.4.0) has been developed with a complete Phase 5 web UI that includes:
- 9 Svelte components (Dashboard, ProfileSwitcher, CollectionSwitcher, VideoSettings, etc.)
- 7 REST API endpoints (`/api/obs/profiles`, `/api/obs/collections`, etc.)
- WebSocket real-time communication for live updates
- Responsive design (mobile, tablet, desktop)

**Current Problem**: 
- The module code exists but CANNOT be deployed
- No way to register routes with the bot's Express server
- No way to serve static UI files
- No way to expose the UI to end users

---

## Proposed Solution

Add module UI capabilities to the GothBot core system by extending the `ModuleContext` API.

### Architecture Requirements

#### 1. Module Metadata Extension

Modules should declare UI capability in their `package.json`:

```json
{
  "name": "@gothbot/obs-master-control",
  "gothbot": {
    "hasUI": true,
    "uiPath": "/obs-control",
    "uiDirectory": "ui/dist"
  }
}
```

#### 2. ModuleContext API Extension

Add route registration methods to `ModuleContext`:

```typescript
interface ModuleContext {
  // Existing APIs...
  logger: Logger;
  config: any;
  obsApi: OBSPublicAPI | null;
  overlay: OverlayAPI;
  
  // NEW: Web UI APIs
  web?: {
    /**
     * Register a GET route handler
     * Routes are automatically prefixed with /modules/{moduleId}
     */
    registerRoute(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      path: string,
      handler: (req: Request, res: Response) => void | Promise<void>
    ): void;
    
    /**
     * Serve static files from a directory
     * Useful for pre-built UI assets
     */
    serveStatic(
      urlPath: string,
      localPath: string
    ): void;
    
    /**
     * Get the base URL for this module's web UI
     * Example: "http://localhost:3000/modules/obs-master-control"
     */
    getBaseUrl(): string;
  };
}
```

#### 3. Module Initialization Flow

When a module with `hasUI: true` is loaded:

1. Bot creates Express router for module: `/modules/{moduleId}`
2. Module's `initialize(context)` receives `context.web` API
3. Module registers routes via `context.web.registerRoute()`
4. Module serves static UI via `context.web.serveStatic()`
5. Bot mounts module router to main Express app

#### 4. Security Considerations

- **Route Isolation**: Each module gets its own path prefix (`/modules/{moduleId}/*`)
- **Authentication**: Module routes should respect bot's authentication middleware
- **CORS**: Module routes should inherit bot's CORS settings
- **Rate Limiting**: Module routes should be rate-limited per-module

---

## Implementation Example

### Module Code (index.js)

```javascript
module.exports = {
  name: 'obs-master-control',
  version: '2.4.0',
  
  async initialize(context) {
    // Existing module initialization...
    await this.initializeOBS(context);
    
    // NEW: Register web UI if available
    if (context.web) {
      // Serve pre-built SvelteKit static files
      context.web.serveStatic('/', './ui/dist');
      
      // Register API endpoints
      context.web.registerRoute('GET', '/api/status', async (req, res) => {
        const status = await this.getStatus();
        res.json(status);
      });
      
      context.web.registerRoute('POST', '/api/profiles', async (req, res) => {
        const result = await this.createProfile(req.body.name);
        res.json(result);
      });
      
      context.logger.info(`UI available at ${context.web.getBaseUrl()}`);
    }
  }
};
```

### Bot Core Implementation (Pseudocode)

```typescript
// src/core/modules/ModuleLoader.ts

async function loadModule(moduleId: string, metadata: ModuleMetadata) {
  const context = new ModuleContextImpl(
    prisma,
    eventBus,
    metadata,
    config,
    botVersion,
    platforms,
    obs
  );
  
  // NEW: Add web API if module has UI
  if (metadata.hasUI) {
    const router = express.Router();
    
    context.web = {
      registerRoute: (method, path, handler) => {
        router[method.toLowerCase()](path, async (req, res) => {
          try {
            await handler(req, res);
          } catch (error) {
            logger.error(`Module ${moduleId} route error`, { error });
            res.status(500).json({ error: 'Internal server error' });
          }
        });
      },
      
      serveStatic: (urlPath, localPath) => {
        const fullPath = join(moduleBasePath, localPath);
        router.use(urlPath, express.static(fullPath));
      },
      
      getBaseUrl: () => {
        return `${config.baseUrl}/modules/${moduleId}`;
      }
    };
    
    // Mount module router to main app
    app.use(`/modules/${moduleId}`, router);
  }
  
  // Initialize module
  await module.initialize(context);
}
```

---

## Benefits

1. **Extensibility**: Modules can provide rich web UIs without core system changes
2. **Isolation**: Each module's UI is sandboxed to its own route namespace
3. **Flexibility**: Modules can use any frontend framework (React, Vue, Svelte, vanilla JS)
4. **Marketplace Ready**: UI modules can be installed/uninstalled like any other module

---

## Migration Path for OBS Master Control

Once this feature is implemented:

1. **Build UI**: Run `npm run build` in obs-control module to create static files
2. **Update Module**: Add route registration in `initialize()`
3. **Deploy**: Module works immediately after marketplace installation
4. **Access**: Users visit `http://localhost:3000/modules/obs-master-control`

---

## Alternative Considered: Separate UI App

**Rejected because**:
- Requires users to run two separate services
- Complex deployment (bot + UI server)
- Additional port management
- Authentication duplication
- Not marketplace-friendly

---

## Success Criteria

- [ ] Modules can register HTTP routes via `context.web.registerRoute()`
- [ ] Modules can serve static files via `context.web.serveStatic()`
- [ ] Module routes are namespaced under `/modules/{moduleId}`
- [ ] Module routes respect bot authentication
- [ ] OBS Master Control UI accessible after installation
- [ ] No breaking changes to existing modules

---

## Files to Modify in GothBot Core

1. `src/core/modules/types.ts` - Add `web` property to `ModuleContext` interface
2. `src/core/modules/ModuleContext.ts` - Implement `web` API in `ModuleContextImpl`
3. `src/core/modules/ModuleLoader.ts` - Create Express routers for modules with `hasUI: true`
4. `src/core/modules/ModuleMetadata.ts` - Add `hasUI`, `uiPath`, `uiDirectory` to metadata schema
5. `src/server.ts` or main Express app - Ensure module routers are mounted

---

## Testing Checklist

- [ ] Module without `hasUI` works as before (no regression)
- [ ] Module with `hasUI` can register routes
- [ ] Module routes are accessible at correct URL
- [ ] Module static files are served correctly
- [ ] Multiple modules with UI don't conflict
- [ ] Module uninstall removes routes cleanly
- [ ] Authentication works on module routes

---

## Documentation Needed

- Module development guide: "Adding a Web UI to Your Module"
- API reference: `context.web` methods
- Example module with UI
- Security best practices for module UIs

---

## Timeline Estimate

**Estimated Effort**: 4-6 hours
- Core implementation: 2-3 hours
- Testing: 1-2 hours  
- Documentation: 1 hour

---

## Questions for Implementation

1. Should module UIs require authentication by default or opt-in?
2. Should there be a middleware hook for modules to customize auth?
3. Should module UIs be listed in a "Module Dashboard" page?
4. Should the bot provide a shared UI framework (e.g., common styles, navigation)?

---

**End of Feature Request**
