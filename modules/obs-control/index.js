/**
 * OBS Control Module
 * Provides dynamic OBS source management and event-driven automation
 */

import { initializeOBSServices } from './src/OBSModuleCore.js';
import { DynamicAlertEngine } from './src/DynamicAlertEngine.js';
import { AutomationEngine } from './src/AutomationEngine.js';

export default {
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
      // The main bot should inject this via context.services.obs
      const obsServiceProvider = context.services?.obs || null;
      
      if (obsServiceProvider) {
        context.logger.info('Using bot OBS service');
      } else {
        context.logger.warn('No OBS service provided by bot - running in standalone mode');
      }

      // Initialize OBS services wrapper
      this.obsServices = await initializeOBSServices({
        host: context.config.host || 'localhost',
        port: context.config.port || 4455,
        password: context.config.password || '',
        autoReconnect: context.config.autoReconnect !== false,
        reconnectDelay: context.config.reconnectDelay || 5000,
        logger: context.logger
      }, obsServiceProvider);

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
