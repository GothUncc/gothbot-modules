/**
 * OBS Module Core
 * Wrapper that provides OBS functionality through the module context
 * 
 * This adapter provides a clean interface to OBS functionality.
 * In production, the actual OBS services will be injected via context.services.obs
 */

export class OBSModuleCore {
  constructor(config, logger, obsServiceProvider = null) {
    this.config = config;
    this.logger = logger;
    this.connected = false;
    this.obsCore = obsServiceProvider; // Injected OBS service from main bot
    this.eventHandlers = new Map();
  }

  /**
   * Initialize and connect to OBS
   * If obsCore is provided (from main bot), use it. Otherwise, create standalone connection.
   */
  async connect() {
    try {
      this.logger.info('Initializing OBS connection', {
        host: this.config.host,
        port: this.config.port,
        hasInjectedService: !!this.obsCore
      });

      if (this.obsCore) {
        // Use injected OBS service from main bot
        this.logger.info('Using bot OBS service');
        
        // Subscribe to existing service events
        if (this.obsCore.on) {
          this.obsCore.on('connected', () => this.handleOBSConnected());
          this.obsCore.on('disconnected', () => this.handleOBSDisconnected());
          this.obsCore.on('error', (err) => this.handleOBSError(err));
        }
        
        // Check if already connected
        this.connected = this.obsCore.isConnected?.() || false;
        
        if (this.connected) {
          this.emit('connected');
        }
      } else {
        // Standalone mode - will need actual OBS WebSocket client
        // This path would use obs-websocket-js directly
        this.logger.warn('No OBS service provided - running in standalone mode');
        this.logger.warn('OBS operations will be simulated until integrated with main bot');
        
        // For development/testing without main bot
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

  /**
   * Handle OBS connected event from main bot service
   */
  handleOBSConnected() {
    this.connected = true;
    this.logger.info('OBS connected via bot service');
    this.emit('connected');
  }

  /**
   * Handle OBS disconnected event
   */
  handleOBSDisconnected() {
    this.connected = false;
    this.logger.warn('OBS disconnected');
    this.emit('disconnected');
  }

  /**
   * Handle OBS error event
   */
  handleOBSError(error) {
    this.logger.error('OBS error from bot service', {
      error: error?.message || 'Unknown error'
    });
    this.emit('error', error);
  }

  /**
   * Disconnect from OBS
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      this.logger.info('Disconnecting from OBS');
      
      // TODO: Disconnect from OBSMasterCore
      // if (this.obsCore) {
      //   await this.obsCore.disconnect();
      // }
      
      this.connected = false;
      this.emit('disconnected');
      
      this.logger.info('Disconnected from OBS');
      
    } catch (error) {
      this.logger.error('Error during OBS disconnect', {
        error: error.message
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  // ============================================================================
  // Scene Management
  // ============================================================================

  /**
   * Get list of all scenes
   */
  async getSceneList() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getSceneList) {
      return await this.obsCore.getSceneList();
    }
    
    this.logger.warn('getSceneList not available - returning empty array');
    return [];
  }

  /**
   * Get current program scene
   */
  async getCurrentProgramScene() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getCurrentProgramScene) {
      return await this.obsCore.getCurrentProgramScene();
    }
    
    this.logger.warn('getCurrentProgramScene not available - returning default');
    return 'Main';
  }

  /**
   * Set current program scene
   */
  async setCurrentProgramScene(sceneName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.setCurrentProgramScene) {
      await this.obsCore.setCurrentProgramScene(sceneName);
      this.logger.info('Scene switched', { sceneName });
      return;
    }
    
    this.logger.warn('setCurrentProgramScene not available', { sceneName });
  }

  // ============================================================================
  // Source Management
  // ============================================================================

  /**
   * Create browser source
   */
  async createBrowserSource(sceneName, sourceName, settings) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.createBrowserSource) {
      await this.obsCore.createBrowserSource(sceneName, sourceName, settings);
      this.logger.info('Browser source created', { scene: sceneName, source: sourceName });
      return;
    }
    
    this.logger.warn('createBrowserSource not available', {
      scene: sceneName,
      source: sourceName,
      url: settings.url
    });
  }

  /**
   * Create image source
   */
  async createImageSource(sceneName, sourceName, settings) {
    this.ensureConnected();
    
    // TODO: Implement via OBSMasterCore
    this.logger.info('Image source creation requested (not implemented)', {
      scene: sceneName,
      source: sourceName
    });
  }

  /**
   * Create text source
   */
  async createTextSource(sceneName, sourceName, settings) {
    this.ensureConnected();
    
    // TODO: Implement via OBSMasterCore
    this.logger.info('Text source creation requested (not implemented)', {
      scene: sceneName,
      source: sourceName
    });
  }

  /**
   * Create media source
   */
  async createMediaSource(sceneName, sourceName, settings) {
    this.ensureConnected();
    
    // TODO: Implement via OBSMasterCore
    this.logger.info('Media source creation requested (not implemented)', {
      scene: sceneName,
      source: sourceName
    });
  }

  /**
   * Remove scene item
   */
  async removeSceneItem(sceneName, sourceName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.removeSceneItem) {
      await this.obsCore.removeSceneItem(sceneName, sourceName);
      this.logger.info('Scene item removed', { scene: sceneName, source: sourceName });
      return;
    }
    
    this.logger.warn('removeSceneItem not available', {
      scene: sceneName,
      source: sourceName
    });
  }

  /**
   * Set source visibility
   */
  async setSourceVisibility(sceneName, sourceName, visible) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.setSceneItemEnabled) {
      await this.obsCore.setSceneItemEnabled(sceneName, sourceName, visible);
      this.logger.info('Source visibility changed', { scene: sceneName, source: sourceName, visible });
      return;
    }
    
    this.logger.warn('setSourceVisibility not available', {
      scene: sceneName,
      source: sourceName,
      visible
    });
  }

  /**
   * Get source visibility
   */
  async getSourceVisibility(sceneName, sourceName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getSceneItemEnabled) {
      return await this.obsCore.getSceneItemEnabled(sceneName, sourceName);
    }
    
    this.logger.warn('getSourceVisibility not available - returning false');
    return false;
  }

  // ============================================================================
  // Media Control
  // ============================================================================

  /**
   * Play media source
   */
  async playMedia(sourceName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.triggerMediaInputAction) {
      await this.obsCore.triggerMediaInputAction(sourceName, 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY');
      this.logger.info('Media playback started', { source: sourceName });
      return;
    }
    
    this.logger.warn('playMedia not available', { source: sourceName });
  }

  /**
   * Pause media source
   */
  async pauseMedia(sourceName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.triggerMediaInputAction) {
      await this.obsCore.triggerMediaInputAction(sourceName, 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE');
      this.logger.info('Media playback paused', { source: sourceName });
      return;
    }
    
    this.logger.warn('pauseMedia not available', { source: sourceName });
  }

  /**
   * Restart media source
   */
  async restartMedia(sourceName) {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.triggerMediaInputAction) {
      await this.obsCore.triggerMediaInputAction(sourceName, 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART');
      this.logger.info('Media playback restarted', { source: sourceName });
      return;
    }
    
    this.logger.warn('restartMedia not available', { source: sourceName });
  }

  // ============================================================================
  // Filter Management
  // ============================================================================

  /**
   * Set source filter enabled state
   */
  async setSourceFilterEnabled(sourceName, filterName, enabled) {
    this.ensureConnected();
    
    // TODO: Implement via OBSMasterCore
    // await this.obsCore.setSourceFilterEnabled(sourceName, filterName, enabled);
    
    this.logger.info('Filter state change requested (not implemented)', {
      source: sourceName,
      filter: filterName,
      enabled
    });
  }

  // ============================================================================
  // Stream/Recording Control
  // ============================================================================

  /**
   * Start streaming
   */
  async startStreaming() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.startStream) {
      await this.obsCore.startStream();
      this.logger.info('Streaming started');
      return;
    }
    
    this.logger.warn('startStreaming not available');
  }

  /**
   * Stop streaming
   */
  async stopStreaming() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.stopStream) {
      await this.obsCore.stopStream();
      this.logger.info('Streaming stopped');
      return;
    }
    
    this.logger.warn('stopStreaming not available');
  }

  /**
   * Start recording
   */
  async startRecording() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.startRecord) {
      await this.obsCore.startRecord();
      this.logger.info('Recording started');
      return;
    }
    
    this.logger.warn('startRecording not available');
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.stopRecord) {
      await this.obsCore.stopRecord();
      this.logger.info('Recording stopped');
      return;
    }
    
    this.logger.warn('stopRecording not available');
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get system stats
   */
  async getSystemStats() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getStats) {
      return await this.obsCore.getStats();
    }
    
    this.logger.warn('getSystemStats not available - returning defaults');
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      fps: 0,
      renderTime: 0,
      available: false
    };
  }

  /**
   * Get streaming stats
   */
  async getStreamingStats() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getStreamStatus) {
      const status = await this.obsCore.getStreamStatus();
      return {
        streaming: status.outputActive || false,
        duration: status.outputDuration || 0,
        bitrate: status.outputBytes || 0,
        droppedFrames: 0
      };
    }
    
    this.logger.warn('getStreamingStats not available - returning defaults');
    return {
      streaming: false,
      duration: 0,
      bitrate: 0,
      droppedFrames: 0,
      available: false
    };
  }

  /**
   * Get recording stats
   */
  async getRecordingStats() {
    this.ensureConnected();
    
    if (this.obsCore && this.obsCore.getRecordStatus) {
      const status = await this.obsCore.getRecordStatus();
      return {
        recording: status.outputActive || false,
        duration: status.outputDuration || 0,
        bytes: status.outputBytes || 0
      };
    }
    
    this.logger.warn('getRecordingStats not available - returning defaults');
    return {
      recording: false,
      duration: 0,
      bytes: 0,
      available: false
    };
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Register event handler
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.logger.error('Event handler error', {
            event: eventName,
            error: error.message
          });
        }
      });
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Ensure connection before operations
   */
  ensureConnected() {
    if (!this.connected) {
      throw new Error('Not connected to OBS WebSocket');
    }
  }
}

/**
 * Initialize OBS services wrapper
 * @param {Object} config - Configuration
 * @param {Object} obsServiceProvider - Optional: OBS service from main bot (context.services.obs)
 */
export async function initializeOBSServices(config, obsServiceProvider = null) {
  const obsCore = new OBSModuleCore(config, config.logger, obsServiceProvider);
  await obsCore.connect();
  return obsCore;
}
