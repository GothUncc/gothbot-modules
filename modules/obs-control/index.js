/**
 * OBS Control Module
 * Provides dynamic OBS source management and event-driven automation
 * 
 * Note: All code is inlined for isolated-vm compatibility (no imports allowed)
 */

// ============================================================================
// OBS Module Core
// ============================================================================

class OBSModuleCore {
  constructor(config, logger, obsServiceProvider = null) {
    this.config = config;
    this.logger = logger;
    this.connected = false;
    this.obsCore = obsServiceProvider;
    this.eventHandlers = new Map();
  }

  async connect() {
    try {
      this.logger.info('Initializing OBS connection', {
        host: this.config.host,
        port: this.config.port,
        hasInjectedService: !!this.obsCore
      });

      if (this.obsCore) {
        this.logger.info('Using bot OBS service');
        
        if (this.obsCore.on) {
          this.obsCore.on('connected', () => this.handleOBSConnected());
          this.obsCore.on('disconnected', () => this.handleOBSDisconnected());
          this.obsCore.on('error', (err) => this.handleOBSError(err));
        }
        
        this.connected = this.obsCore.isConnected?.() || false;
        
        if (this.connected) {
          this.emit('connected');
        }
      } else {
        this.logger.warn('No OBS service provided - running in standalone mode');
        this.connected = false;
      }
      
      this.logger.info('OBS Module Core initialized');
    } catch (error) {
      this.logger.error('Failed to initialize OBS connection', {
        error: error.message,
        stack: error.stack
      });
      this.connected = false;
      throw error;
    }
  }

  handleOBSConnected() {
    this.connected = true;
    this.logger.info('OBS connected via bot service');
    this.emit('connected');
  }

  handleOBSDisconnected() {
    this.connected = false;
    this.logger.warn('OBS disconnected');
    this.emit('disconnected');
  }

  handleOBSError(error) {
    this.logger.error('OBS error from bot service', {
      error: error?.message || 'Unknown error'
    });
    this.emit('error', error);
  }

  async disconnect() {
    if (!this.connected) return;
    
    try {
      this.logger.info('Disconnecting from OBS');
      this.connected = false;
      this.emit('disconnected');
      this.logger.info('Disconnected from OBS');
    } catch (error) {
      this.logger.error('Error during OBS disconnect', { error: error.message });
    }
  }

  isConnected() {
    return this.connected;
  }

  ensureConnected() {
    if (!this.connected) {
      throw new Error('Not connected to OBS WebSocket');
    }
  }

  // Scene management
  async getSceneList() {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.getSceneList) {
      return await this.obsCore.getSceneList();
    }
    this.logger.warn('getSceneList not available');
    return [];
  }

  async getCurrentProgramScene() {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.getCurrentProgramScene) {
      return await this.obsCore.getCurrentProgramScene();
    }
    this.logger.warn('getCurrentProgramScene not available');
    return 'Main';
  }

  async setCurrentProgramScene(sceneName) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.setCurrentProgramScene) {
      await this.obsCore.setCurrentProgramScene(sceneName);
      this.logger.info('Scene switched', { sceneName });
      return;
    }
    this.logger.warn('setCurrentProgramScene not available', { sceneName });
  }

  // Source management
  async createBrowserSource(sceneName, sourceName, settings) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.createBrowserSource) {
      await this.obsCore.createBrowserSource(sceneName, sourceName, settings);
      this.logger.info('Browser source created', { scene: sceneName, source: sourceName });
      return;
    }
    this.logger.warn('createBrowserSource not available', { scene: sceneName, source: sourceName });
  }

  async removeSceneItem(sceneName, sourceName) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.removeSceneItem) {
      await this.obsCore.removeSceneItem(sceneName, sourceName);
      this.logger.info('Scene item removed', { scene: sceneName, source: sourceName });
      return;
    }
    this.logger.warn('removeSceneItem not available', { scene: sceneName, source: sourceName });
  }

  async setSourceVisibility(sceneName, sourceName, visible) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.setSceneItemEnabled) {
      await this.obsCore.setSceneItemEnabled(sceneName, sourceName, visible);
      this.logger.info('Source visibility changed', { scene: sceneName, source: sourceName, visible });
      return;
    }
    this.logger.warn('setSourceVisibility not available', { scene: sceneName, source: sourceName, visible });
  }

  async getSourceVisibility(sceneName, sourceName) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.getSceneItemEnabled) {
      return await this.obsCore.getSceneItemEnabled(sceneName, sourceName);
    }
    this.logger.warn('getSourceVisibility not available');
    return false;
  }

  // Media control
  async playMedia(sourceName) {
    this.ensureConnected();
    if (this.obsCore && this.obsCore.triggerMediaInputAction) {
      await this.obsCore.triggerMediaInputAction(sourceName, 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY');
      this.logger.info('Media playback started', { source: sourceName });
      return;
    }
    this.logger.warn('playMedia not available', { source: sourceName });
  }

  // Event handling
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  emit(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.logger.error('Event handler error', { event: eventName, error: error.message });
        }
      });
    }
  }
}

// ============================================================================
// Dynamic Alert Engine (Simplified)
// ============================================================================

class DynamicAlertEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.activeAlerts = new Map();
    this.alertQueue = [];
    this.processing = false;
  }

  async showAlert(config) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.context.logger.info('Alert requested', { id: alertId, type: config.type });
    
    // For now, just log - full implementation requires bot integration
    this.context.logger.warn('Alert system requires full OBS integration');
    
    return alertId;
  }

  getQueueStatus() {
    return {
      activeAlerts: this.activeAlerts.size,
      queuedAlerts: this.alertQueue.length,
      processing: this.processing
    };
  }

  async cleanup() {
    this.alertQueue = [];
    this.activeAlerts.clear();
    this.processing = false;
  }
}

// ============================================================================
// Automation Engine (Simplified)
// ============================================================================

class AutomationEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.rules = new Map();
  }

  registerRule(rule) {
    const ruleId = rule.id || `rule_${Date.now()}`;
    this.rules.set(ruleId, rule);
    this.context.logger.info('Automation rule registered', { ruleId, eventType: rule.eventType });
    return ruleId;
  }

  unregisterRule(ruleId) {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.context.logger.info('Automation rule unregistered', { ruleId });
    }
    return deleted;
  }

  getRules() {
    return Array.from(this.rules.values());
  }

  async cleanup() {
    this.rules.clear();
  }
}

// ============================================================================
// Main Module Export
// ============================================================================

module.exports = {
  name: 'obs-control',
  version: '1.0.0',

  // Module state
  obsServices: null,
  alertEngine: null,
  automationEngine: null,
  isConnected: false,

  /**
   * Configuration schema
   */
  configSchema: {
    host: {
      type: 'string',
      label: 'OBS WebSocket Host',
      description: 'Hostname or IP address of OBS WebSocket server',
      default: 'localhost',
      required: true
    },
    port: {
      type: 'number',
      label: 'OBS WebSocket Port',
      description: 'Port number for OBS WebSocket connection',
      default: 4455,
      minimum: 1,
      maximum: 65535,
      required: true
    },
    password: {
      type: 'string',
      label: 'OBS WebSocket Password',
      description: 'Leave blank if no password is set',
      default: ''
    },
    autoReconnect: {
      type: 'boolean',
      label: 'Auto Reconnect',
      description: 'Automatically reconnect when connection is lost',
      default: true
    },
    reconnectDelay: {
      type: 'number',
      label: 'Reconnect Delay (ms)',
      description: 'Time to wait before attempting reconnection',
      default: 5000,
      minimum: 1000,
      maximum: 30000
    }
  },

  /**
   * Initialize module
   */
  async initialize(context) {
    context.logger.info('OBS Control module initializing', {
      host: context.config.host,
      port: context.config.port
    });

    try {
      // Get OBS service from bot if available
      const obsServiceProvider = context.services?.obs || null;
      
      if (obsServiceProvider) {
        context.logger.info('Using bot OBS service');
      } else {
        context.logger.warn('No OBS service provided by bot - running in standalone mode');
      }

      // Initialize OBS services wrapper
      this.obsServices = new OBSModuleCore({
        host: context.config.host || 'localhost',
        port: context.config.port || 4455,
        password: context.config.password || '',
        autoReconnect: context.config.autoReconnect !== false,
        reconnectDelay: context.config.reconnectDelay || 5000,
        logger: context.logger
      }, context.logger, obsServiceProvider);
      
      await this.obsServices.connect();

      // Setup components
      this.alertEngine = new DynamicAlertEngine(this.obsServices, context);
      this.automationEngine = new AutomationEngine(this.obsServices, context);

      // Connection event handlers
      this.obsServices.on('connected', () => {
        this.isConnected = true;
        context.logger.info('Connected to OBS');
        context.emit('obs:connected');
      });

      this.obsServices.on('disconnected', () => {
        this.isConnected = false;
        context.logger.warn('Disconnected from OBS');
        context.emit('obs:disconnected');
      });

      this.obsServices.on('error', (error) => {
        context.logger.error('OBS error', { error: error?.message || 'Unknown error' });
        context.emit('obs:error', error);
      });

      // Setup event-driven automation examples
      this.setupDefaultAutomations(context);

      // Store API in context for other modules
      context.obsApi = this.getPublicAPI(context);

      context.logger.info('OBS Control module initialized successfully');

    } catch (error) {
      context.logger.error('Failed to initialize OBS Control', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Start module services
   */
  async start(context) {
    context.logger.info('OBS Control module starting');
    
    // Connection is handled in initialize
    // Services are ready to use
  },

  /**
   * Stop module services
   */
  async stop(context) {
    context.logger.info('OBS Control module stopping');
    
    // Cleanup automation and alerts
    if (this.automationEngine) {
      await this.automationEngine.cleanup();
    }

    if (this.alertEngine) {
      await this.alertEngine.cleanup();
    }
  },

  /**
   * Shutdown and cleanup
   */
  async shutdown(context) {
    context.logger.info('OBS Control module shutting down');
    
    // Disconnect from OBS
    if (this.obsServices) {
      await this.obsServices.disconnect();
    }
    
    this.obsServices = null;
    this.alertEngine = null;
    this.automationEngine = null;
    this.isConnected = false;
  },

  /**
   * Setup default automation examples
   */
  setupDefaultAutomations(context) {
    // Example: Scene switch on large raid
    this.automationEngine.registerRule({
      id: 'large-raid-celebration',
      eventType: 'raid',
      conditions: {
        minViewers: 50
      },
      actions: [
        { type: 'log', message: 'Large raid detected!' },
        // Add more actions as needed
      ]
    });

    context.logger.info('Default automations registered');
  },

  /**
   * Get public API for other modules
   */
  getPublicAPI(context) {
    return {
      // Connection status
      isConnected: () => this.isConnected,

      // Scene management
      getScenes: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.getSceneList();
      },
      
      getCurrentScene: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.getCurrentProgramScene();
      },
      
      setScene: async (sceneName) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.setCurrentProgramScene(sceneName);
      },

      // Dynamic source management
      createSource: async (config) => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return await this.alertEngine.createDynamicSource(config);
      },
      
      removeSource: async (sourceId) => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return await this.alertEngine.removeDynamicSource(sourceId);
      },
      
      updateSource: async (sourceId, updates) => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return await this.alertEngine.updateSource(sourceId, updates);
      },

      // Alert system
      showAlert: async (alertConfig) => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return await this.alertEngine.showAlert(alertConfig);
      },
      
      hideAlert: async (alertId) => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return await this.alertEngine.hideAlert(alertId);
      },
      
      getAlertQueueStatus: () => {
        if (!this.alertEngine) throw new Error('Alert engine not initialized');
        return this.alertEngine.getQueueStatus();
      },

      // Automation
      registerAutomation: (rule) => {
        if (!this.automationEngine) throw new Error('Automation engine not initialized');
        return this.automationEngine.registerRule(rule);
      },
      
      unregisterAutomation: (ruleId) => {
        if (!this.automationEngine) throw new Error('Automation engine not initialized');
        return this.automationEngine.unregisterRule(ruleId);
      },
      
      executeAction: async (action, event = {}) => {
        if (!this.automationEngine) throw new Error('Automation engine not initialized');
        return await this.automationEngine.executeAction(action, event);
      },
      
      getAutomations: () => {
        if (!this.automationEngine) throw new Error('Automation engine not initialized');
        return this.automationEngine.getRules();
      },

      // Source control
      showSource: async (scene, source) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.setSourceVisibility(scene, source, true);
      },
      
      hideSource: async (scene, source) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.setSourceVisibility(scene, source, false);
      },

      // Media control
      playMedia: async (source) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.playMedia(source);
      },
      
      pauseMedia: async (source) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.pauseMedia(source);
      },
      
      restartMedia: async (source) => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.restartMedia(source);
      },

      // Stream/Recording control
      startStreaming: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.startStreaming();
      },
      
      stopStreaming: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.stopStreaming();
      },
      
      startRecording: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.startRecording();
      },
      
      stopRecording: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.stopRecording();
      },

      // Statistics
      getStats: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.getSystemStats();
      },
      
      getStreamingStats: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.getStreamingStats();
      },
      
      getRecordingStats: async () => {
        if (!this.obsServices) throw new Error('OBS services not initialized');
        return await this.obsServices.getRecordingStats();
      }
    };
  }
};
