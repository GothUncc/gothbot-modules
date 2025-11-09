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
// Dynamic Alert Engine
// ============================================================================

class DynamicAlertEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.activeAlerts = new Map();
    this.alertQueue = [];
    this.processing = false;
    this.maxConcurrentAlerts = 3;
  }

  async showAlert(config) {
    const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const alert = {
      id: alertId,
      type: config.type || 'generic',
      sourceName: 'DynamicAlert_' + alertId,
      sceneName: config.scene || null,
      duration: config.duration || 5000,
      url: config.url || this.buildAlertUrl(config),
      width: config.width || 1920,
      height: config.height || 1080,
      config: config
    };

    this.context.logger.info('Alert queued', {
      id: alertId,
      type: alert.type,
      queueSize: this.alertQueue.length + 1
    });

    this.alertQueue.push(alert);

    if (!this.processing) {
      this.processQueue();
    }

    return alertId;
  }

  buildAlertUrl(config) {
    const params = [];
    params.push('type=' + encodeURIComponent(config.type || 'generic'));
    params.push('username=' + encodeURIComponent(config.username || 'Viewer'));
    params.push('message=' + encodeURIComponent(config.message || ''));
    params.push('amount=' + encodeURIComponent(config.amount || ''));
    params.push('duration=' + encodeURIComponent(config.duration || 5000));
    
    return 'http://localhost:3000/overlay/alert?' + params.join('&');
  }

  async processQueue() {
    const self = this;
    
    if (self.processing || self.alertQueue.length === 0) {
      return;
    }

    if (self.activeAlerts.size >= self.maxConcurrentAlerts) {
      self.context.logger.debug('Max concurrent alerts reached, waiting', {
        active: self.activeAlerts.size,
        queued: self.alertQueue.length
      });
      
      setTimeout(function() { self.processQueue(); }, 500);
      return;
    }

    self.processing = true;
    const alert = self.alertQueue.shift();

    try {
      if (!alert.sceneName) {
        alert.sceneName = await self.obsCore.getCurrentProgramScene();
      }

      self.context.logger.info('Displaying alert', {
        id: alert.id,
        type: alert.type,
        scene: alert.sceneName,
        duration: alert.duration
      });

      await self.obsCore.createBrowserSource(
        alert.sceneName,
        alert.sourceName,
        {
          url: alert.url,
          width: alert.width,
          height: alert.height,
          fps: 60,
          shutdown: true,
          restart_when_active: false
        }
      );

      await self.obsCore.setSourceVisibility(alert.sceneName, alert.sourceName, true);

      self.activeAlerts.set(alert.id, {
        id: alert.id,
        type: alert.type,
        sourceName: alert.sourceName,
        sceneName: alert.sceneName,
        duration: alert.duration,
        url: alert.url,
        width: alert.width,
        height: alert.height,
        config: alert.config,
        startTime: Date.now(),
        timeout: null
      });

      const timeout = setTimeout(function() {
        self.hideAlert(alert.id);
      }, alert.duration);

      self.activeAlerts.get(alert.id).timeout = timeout;

      self.context.logger.info('Alert displayed successfully', {
        id: alert.id,
        activeCount: self.activeAlerts.size
      });

    } catch (error) {
      self.context.logger.error('Failed to display alert', {
        id: alert.id,
        error: error.message,
        stack: error.stack
      });
    } finally {
      self.processing = false;

      if (self.alertQueue.length > 0) {
        setTimeout(function() { self.processQueue(); }, 100);
      }
    }
  }

  async hideAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      this.context.logger.warn('Alert not found for hiding', { alertId: alertId });
      return;
    }

    try {
      if (alert.timeout) {
        clearTimeout(alert.timeout);
      }

      this.context.logger.info('Hiding alert', {
        id: alertId,
        displayTime: Date.now() - alert.startTime
      });

      await this.obsCore.setSourceVisibility(alert.sceneName, alert.sourceName, false);

      await new Promise(function(resolve) { setTimeout(resolve, 500); });

      await this.obsCore.removeSceneItem(alert.sceneName, alert.sourceName);

      this.activeAlerts.delete(alertId);

      this.context.logger.info('Alert removed successfully', {
        id: alertId,
        remainingActive: this.activeAlerts.size
      });

      if (this.alertQueue.length > 0) {
        this.processQueue();
      }

    } catch (error) {
      this.context.logger.error('Failed to hide alert', {
        id: alertId,
        error: error.message,
        stack: error.stack
      });

      this.activeAlerts.delete(alertId);
    }
  }

  async createDynamicSource(config) {
    const sourceId = 'dynamic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const sourceName = config.name || sourceId;
    const sceneName = config.scene || await this.obsCore.getCurrentProgramScene();

    try {
      switch (config.type) {
        case 'browser':
          await this.obsCore.createBrowserSource(sceneName, sourceName, config.settings);
          break;

        case 'image':
          await this.obsCore.createImageSource(sceneName, sourceName, config.settings);
          break;

        case 'text':
          await this.obsCore.createTextSource(sceneName, sourceName, config.settings);
          break;

        case 'media':
          await this.obsCore.createMediaSource(sceneName, sourceName, config.settings);
          break;

        default:
          throw new Error('Unsupported source type: ' + config.type);
      }

      this.context.logger.info('Dynamic source created', {
        id: sourceId,
        name: sourceName,
        type: config.type,
        scene: sceneName
      });

      return sourceId;

    } catch (error) {
      this.context.logger.error('Failed to create dynamic source', {
        error: error.message,
        config: config
      });
      throw error;
    }
  }

  getQueueStatus() {
    return {
      activeAlerts: this.activeAlerts.size,
      queuedAlerts: this.alertQueue.length,
      maxConcurrent: this.maxConcurrentAlerts,
      processing: this.processing
    };
  }

  async cleanup() {
    this.context.logger.info('Cleaning up alert engine', {
      activeAlerts: this.activeAlerts.size,
      queuedAlerts: this.alertQueue.length
    });

    this.alertQueue = [];

    const alertIds = Array.from(this.activeAlerts.keys());
    for (let i = 0; i < alertIds.length; i++) {
      await this.hideAlert(alertIds[i]);
    }

    this.processing = false;

    this.context.logger.info('Alert engine cleanup complete');
  }
}

// ============================================================================
// Automation Engine
// ============================================================================

class AutomationEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.rules = new Map();
    this.eventHandlers = new Map();
  }

  registerRule(rule) {
    const ruleId = rule.id || 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    if (!rule.eventType) {
      throw new Error('Rule must have an eventType');
    }
    if (!rule.actions || !Array.isArray(rule.actions)) {
      throw new Error('Rule must have actions array');
    }

    this.rules.set(ruleId, {
      id: ruleId,
      eventType: rule.eventType,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled !== false,
      stopOnError: rule.stopOnError,
      createdAt: Date.now()
    });

    const self = this;
    const handler = async function(event) {
      await self.executeRule(ruleId, event);
    };

    this.context.on(rule.eventType, handler);
    this.eventHandlers.set(ruleId, { eventType: rule.eventType, handler: handler });

    this.context.logger.info('Automation rule registered', {
      ruleId: ruleId,
      eventType: rule.eventType,
      actionCount: rule.actions.length
    });

    return ruleId;
  }

  unregisterRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      this.context.logger.warn('Rule not found for unregistration', { ruleId: ruleId });
      return false;
    }

    const handlerInfo = this.eventHandlers.get(ruleId);
    if (handlerInfo) {
      this.context.off(handlerInfo.eventType, handlerInfo.handler);
      this.eventHandlers.delete(ruleId);
    }

    this.rules.delete(ruleId);

    this.context.logger.info('Automation rule unregistered', { ruleId: ruleId });
    return true;
  }

  async executeRule(ruleId, event) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return;
    }

    if (!rule.enabled) {
      return;
    }

    this.context.logger.debug('Evaluating automation rule', {
      ruleId: ruleId,
      eventType: event.type,
      hasConditions: !!rule.conditions
    });

    if (rule.conditions && !this.evaluateConditions(rule.conditions, event)) {
      this.context.logger.debug('Rule conditions not met', { ruleId: ruleId });
      return;
    }

    this.context.logger.info('Executing automation rule', {
      ruleId: ruleId,
      actionCount: rule.actions.length
    });

    for (let i = 0; i < rule.actions.length; i++) {
      const action = rule.actions[i];
      
      try {
        await this.executeAction(action, event);
      } catch (error) {
        this.context.logger.error('Automation action failed', {
          ruleId: ruleId,
          actionIndex: i,
          actionType: action.type,
          error: error.message,
          stack: error.stack
        });

        if (rule.stopOnError) {
          break;
        }
      }
    }
  }

  async executeAction(action, event) {
    this.context.logger.debug('Executing action', {
      type: action.type,
      eventType: event.type
    });

    switch (action.type) {
      case 'switch_scene':
        await this.obsCore.setCurrentProgramScene(action.sceneName);
        break;

      case 'show_source':
        await this.obsCore.setSourceVisibility(
          action.scene || await this.obsCore.getCurrentProgramScene(),
          action.source,
          true
        );
        break;

      case 'hide_source':
        await this.obsCore.setSourceVisibility(
          action.scene || await this.obsCore.getCurrentProgramScene(),
          action.source,
          false
        );
        break;

      case 'toggle_source':
        var currentScene = await this.obsCore.getCurrentProgramScene();
        var visible = await this.obsCore.getSourceVisibility(currentScene, action.source);
        await this.obsCore.setSourceVisibility(currentScene, action.source, !visible);
        break;

      case 'play_media':
        await this.obsCore.playMedia(action.source);
        break;

      case 'pause_media':
        await this.obsCore.pauseMedia(action.source);
        break;

      case 'restart_media':
        await this.obsCore.restartMedia(action.source);
        break;

      case 'set_filter_enabled':
        await this.obsCore.setSourceFilterEnabled(
          action.source,
          action.filter,
          action.enabled
        );
        break;

      case 'start_streaming':
        await this.obsCore.startStreaming();
        break;

      case 'stop_streaming':
        await this.obsCore.stopStreaming();
        break;

      case 'start_recording':
        await this.obsCore.startRecording();
        break;

      case 'stop_recording':
        await this.obsCore.stopRecording();
        break;

      case 'delay':
        await new Promise(function(resolve) { 
          setTimeout(resolve, action.duration || 1000); 
        });
        break;

      case 'emit_event':
        await this.context.emit(action.eventName, {
          data: action.data,
          originalEvent: event
        });
        break;

      case 'log':
        this.context.logger.info('Automation log', {
          message: action.message,
          event: event.type
        });
        break;

      default:
        this.context.logger.warn('Unknown action type', {
          type: action.type
        });
    }
  }

  evaluateConditions(conditions, event) {
    if (conditions.platform) {
      const platforms = Array.isArray(conditions.platform) 
        ? conditions.platform 
        : [conditions.platform];
      
      if (!platforms.includes(event.platform)) {
        return false;
      }
    }

    if (conditions.minViewers !== undefined && event.viewers < conditions.minViewers) {
      return false;
    }
    if (conditions.minAmount !== undefined && event.amount < conditions.minAmount) {
      return false;
    }
    if (conditions.minBits !== undefined && event.bits < conditions.minBits) {
      return false;
    }

    if (conditions.maxViewers !== undefined && event.viewers > conditions.maxViewers) {
      return false;
    }
    if (conditions.maxAmount !== undefined && event.amount > conditions.maxAmount) {
      return false;
    }

    if (conditions.users) {
      const users = Array.isArray(conditions.users) ? conditions.users : [conditions.users];
      if (!users.includes(event.user && event.user.username)) {
        return false;
      }
    }

    if (conditions.custom && typeof conditions.custom === 'function') {
      return conditions.custom(event);
    }

    return true;
  }

  getRules() {
    return Array.from(this.rules.values());
  }

  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  setRuleEnabled(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    rule.enabled = enabled;
    this.context.logger.info('Rule enabled status changed', { ruleId: ruleId, enabled: enabled });
    return true;
  }

  async cleanup() {
    this.context.logger.info('Cleaning up automation engine', {
      ruleCount: this.rules.size
    });

    const ruleIds = Array.from(this.rules.keys());
    for (let i = 0; i < ruleIds.length; i++) {
      this.unregisterRule(ruleIds[i]);
    }

    this.rules.clear();
    this.eventHandlers.clear();

    this.context.logger.info('Automation engine cleanup complete');
  }
}

// ============================================================================
// Main Module Export
// ============================================================================

// Module-level state (cannot use 'this' in isolated-vm)
let obsServices = null;
let alertEngine = null;
let automationEngine = null;
let isConnected = false;
let moduleContext = null;

/**
 * Setup default automation examples
 */
function setupDefaultAutomations(context) {
  // Example: Scene switch on large raid
  automationEngine.registerRule({
    id: 'large-raid-celebration',
    eventType: 'raid',
    conditions: {
      minViewers: 50
    },
    actions: [
      { type: 'log', message: 'Large raid detected!' }
    ]
  });

  context.logger.info('Default automations registered');
}

/**
 * Get public API for other modules
 */
function getPublicAPI(context) {
  return {
    // Connection status
    isConnected: function() { return isConnected; },

    // Scene management
    getScenes: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSceneList();
    },
    
    getCurrentScene: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getCurrentProgramScene();
    },
    
    setScene: async function(sceneName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setCurrentProgramScene(sceneName);
    },

    // Alert system
    showAlert: async function(alertConfig) {
      if (!alertEngine) throw new Error('Alert engine not initialized');
      return await alertEngine.showAlert(alertConfig);
    },
    
    hideAlert: async function(alertId) {
      if (!alertEngine) throw new Error('Alert engine not initialized');
      return await alertEngine.hideAlert(alertId);
    },
    
    getAlertQueueStatus: function() {
      if (!alertEngine) throw new Error('Alert engine not initialized');
      return alertEngine.getQueueStatus();
    },

    // Automation
    registerAutomation: function(rule) {
      if (!automationEngine) throw new Error('Automation engine not initialized');
      return automationEngine.registerRule(rule);
    },
    
    unregisterAutomation: function(ruleId) {
      if (!automationEngine) throw new Error('Automation engine not initialized');
      return automationEngine.unregisterRule(ruleId);
    },
    
    executeAction: async function(action, event) {
      if (!automationEngine) throw new Error('Automation engine not initialized');
      return await automationEngine.executeAction(action, event || {});
    },
    
    getAutomations: function() {
      if (!automationEngine) throw new Error('Automation engine not initialized');
      return automationEngine.getRules();
    },

    // Source control
    showSource: async function(scene, source) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSourceVisibility(scene, source, true);
    },
    
    hideSource: async function(scene, source) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSourceVisibility(scene, source, false);
    },

    // Media control
    playMedia: async function(source) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.playMedia(source);
    },
    
    pauseMedia: async function(source) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.pauseMedia(source);
    },
    
    restartMedia: async function(source) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.restartMedia(source);
    },

    // Stream/Recording control
    startStreaming: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.startStreaming();
    },
    
    stopStreaming: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.stopStreaming();
    },
    
    startRecording: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.startRecording();
    },
    
    stopRecording: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.stopRecording();
    },

    // Statistics
    getStats: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSystemStats();
    },
    
    getStreamingStats: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getStreamingStats();
    },
    
    getRecordingStats: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getRecordingStats();
    }
  };
}

module.exports = {
  name: 'obs-control',
  version: '1.0.0',

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
  initialize: async function(context) {
    moduleContext = context;
    
    context.logger.info('OBS Control module initializing', {
      host: context.config.host,
      port: context.config.port
    });

    try {
      // Get OBS service from bot if available
      const obsServiceProvider = context.services && context.services.obs ? context.services.obs : null;
      
      if (obsServiceProvider) {
        context.logger.info('Using bot OBS service');
      } else {
        context.logger.warn('No OBS service provided by bot - running in standalone mode');
      }

      // Initialize OBS services wrapper
      obsServices = new OBSModuleCore({
        host: context.config.host || 'localhost',
        port: context.config.port || 4455,
        password: context.config.password || '',
        autoReconnect: context.config.autoReconnect !== false,
        reconnectDelay: context.config.reconnectDelay || 5000,
        logger: context.logger
      }, context.logger, obsServiceProvider);
      
      await obsServices.connect();

      // Setup components
      alertEngine = new DynamicAlertEngine(obsServices, context);
      automationEngine = new AutomationEngine(obsServices, context);

      // Connection event handlers
      obsServices.on('connected', function() {
        isConnected = true;
        context.logger.info('Connected to OBS');
        context.emit('obs:connected');
      });

      obsServices.on('disconnected', function() {
        isConnected = false;
        context.logger.warn('Disconnected from OBS');
        context.emit('obs:disconnected');
      });

      obsServices.on('error', function(error) {
        context.logger.error('OBS error', { error: error && error.message ? error.message : 'Unknown error' });
        context.emit('obs:error', error);
      });

      // Setup event-driven automation examples
      setupDefaultAutomations(context);

      // Store API in context for other modules
      context.obsApi = getPublicAPI(context);

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
   * Stop module services
   */
  stop: function() {
    if (moduleContext) {
      moduleContext.logger.info('OBS Control module stopping');
    }
    
    // Clear references (cleanup is synchronous for simple engines)
    if (automationEngine && automationEngine.rules) {
      automationEngine.rules.clear();
    }

    if (alertEngine && alertEngine.activeAlerts) {
      alertEngine.activeAlerts.clear();
    }
    
    // Mark as disconnected
    if (obsServices) {
      obsServices.connected = false;
    }
    
    // Clear module state
    obsServices = null;
    alertEngine = null;
    automationEngine = null;
    isConnected = false;
    moduleContext = null;
  }
};
