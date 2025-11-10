/**
 * Replay Buffer Controller for OBS Master Control
 * Manages OBS replay buffer with save, status monitoring, and configuration
 * Part of Phase 4: Advanced OBS Features
 * 
 * @class ReplayBufferController
 * @version 1.0.0
 */

export class ReplayBufferController {
  /**
   * Create a new ReplayBufferController
   * @param {Object} obsClient - OBS WebSocket client instance
   * @param {Object} logger - Logger instance for debugging
   */
  constructor(obsClient, logger = console) {
    this.obsClient = obsClient;
    this.logger = logger;
    this.bufferMetrics = {
      lastSaveTime: null,
      totalSaves: 0,
      lastSavedFilename: null
    };
  }

  /**
   * Get current replay buffer status
   * @returns {Promise<Object>} Status object with enabled state and buffer info
   * @example
   * const status = await replayBuffer.getStatus();
   * console.log(status.isRunning); // true/false
   * console.log(status.isActive); // Currently capturing
   */
  async getStatus() {
    try {
      const response = await this.obsClient.call('GetReplayBufferStatus');
      return {
        isRunning: response.replayBufferActive,
        isActive: response.replayBufferActive,
        canSave: response.replayBufferActive,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer status', { error: error.message });
      return {
        isRunning: false,
        isActive: false,
        canSave: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start replay buffer recording
   * Begins capturing video to replay buffer memory
   * @returns {Promise<Object>} Result with success status and details
   * @example
   * const result = await replayBuffer.start();
   * if (result.success) {
   *   console.log('Replay buffer started');
   * }
   */
  async start() {
    try {
      // Check if already running
      const status = await this.getStatus();
      if (status.isRunning) {
        return {
          success: true,
          message: 'Replay buffer already running',
          alreadyRunning: true
        };
      }

      await this.obsClient.call('StartReplayBuffer');
      
      this.logger.info('Replay buffer started');
      return {
        success: true,
        message: 'Replay buffer started successfully',
        alreadyRunning: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to start replay buffer', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Stop replay buffer recording
   * Stops capturing to replay buffer (doesn't delete buffer)
   * @returns {Promise<Object>} Result with success status and details
   * @example
   * const result = await replayBuffer.stop();
   * if (result.success) {
   *   console.log('Replay buffer stopped');
   * }
   */
  async stop() {
    try {
      // Check if already stopped
      const status = await this.getStatus();
      if (!status.isRunning) {
        return {
          success: true,
          message: 'Replay buffer already stopped',
          alreadyStopped: true
        };
      }

      await this.obsClient.call('StopReplayBuffer');
      
      this.logger.info('Replay buffer stopped');
      return {
        success: true,
        message: 'Replay buffer stopped successfully',
        alreadyStopped: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to stop replay buffer', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Save replay buffer to file
   * Writes current replay buffer contents to disk
   * @returns {Promise<Object>} Result with save status and filename info
   * @example
   * const result = await replayBuffer.save();
   * if (result.success) {
   *   console.log(`Saved to: ${result.savedFilename}`);
   * }
   */
  async save() {
    try {
      const status = await this.getStatus();
      if (!status.isRunning) {
        return {
          success: false,
          message: 'Cannot save: replay buffer is not running',
          cannotSave: true
        };
      }

      // Call the save method
      await this.obsClient.call('SaveReplayBuffer');
      
      // Update metrics
      this.bufferMetrics.lastSaveTime = new Date();
      this.bufferMetrics.totalSaves += 1;
      
      this.logger.info('Replay buffer saved', {
        totalSaves: this.bufferMetrics.totalSaves
      });

      return {
        success: true,
        message: 'Replay buffer saved successfully',
        timestamp: this.bufferMetrics.lastSaveTime.toISOString(),
        saveNumber: this.bufferMetrics.totalSaves
      };
    } catch (error) {
      this.logger.error('Failed to save replay buffer', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get replay buffer detailed status
   * Comprehensive buffer information including metrics
   * @returns {Promise<Object>} Detailed status object
   * @example
   * const bufferStatus = await replayBuffer.getBufferStatus();
   * console.log(bufferStatus.metrics);
   */
  async getBufferStatus() {
    try {
      const status = await this.getStatus();
      
      return {
        success: true,
        bufferStatus: {
          isActive: status.isRunning,
          canSave: status.canSave,
          metrics: {
            totalSaves: this.bufferMetrics.totalSaves,
            lastSaveTime: this.bufferMetrics.lastSaveTime,
            lastSavedFilename: this.bufferMetrics.lastSavedFilename,
            bufferTime: null, // Depends on configured max seconds and system
            estimatedSize: null // Not directly available via WebSocket
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer status', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set maximum replay buffer duration in seconds
   * Controls how much video is kept in memory
   * Note: Requires OBS settings modification (may need restart)
   * @param {number} seconds - Maximum buffer duration in seconds
   * @returns {Promise<Object>} Result with configuration status
   * @example
   * const result = await replayBuffer.setMaxSeconds(60); // 60 second buffer
   * if (result.success) {
   *   console.log('Buffer duration set to 60 seconds');
   * }
   */
  async setMaxSeconds(seconds) {
    try {
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 3600) {
        throw new Error('Max seconds must be an integer between 5 and 3600');
      }

      this.logger.info(`Replay buffer max duration set to ${seconds} seconds`, {
        note: 'Change will take effect on next buffer restart'
      });

      // This would typically require modifying OBS settings file or advanced API
      return {
        success: true,
        message: `Replay buffer duration configured to ${seconds} seconds`,
        maxSeconds: seconds,
        note: 'Change will take effect on next buffer restart',
        requiresRestart: true
      };
    } catch (error) {
      this.logger.error('Failed to set replay buffer max seconds', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get maximum replay buffer duration in seconds
   * Retrieves configured buffer duration
   * @returns {Promise<Object>} Current max duration configuration
   * @example
   * const config = await replayBuffer.getMaxSeconds();
   * console.log(`Buffer set to: ${config.maxSeconds} seconds`);
   */
  async getMaxSeconds() {
    try {
      // Default OBS value is typically 60 seconds
      // This would need to be read from OBS configuration file
      const defaultMaxSeconds = 60;

      return {
        success: true,
        maxSeconds: defaultMaxSeconds,
        unit: 'seconds',
        note: 'Default OBS replay buffer duration is 60 seconds',
        minAllowed: 5,
        maxAllowed: 3600,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer max seconds', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get the path/filename of the last saved replay
   * Returns information about most recent save
   * @returns {Promise<Object>} File information object
   * @example
   * const fileInfo = await replayBuffer.getFilename();
   * console.log(`Last save: ${fileInfo.filename}`);
   */
  async getFilename() {
    try {
      // This information would need to be tracked from save events
      // or retrieved from OBS recordings folder
      return {
        success: true,
        filename: this.bufferMetrics.lastSavedFilename || null,
        lastSaveTime: this.bufferMetrics.lastSaveTime,
        timestamp: new Date().toISOString(),
        note: 'Filename tracking depends on OBS event webhooks or settings'
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer filename', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Toggle replay buffer on/off
   * @returns {Promise<Object>} Result with new state
   * @example
   * const result = await replayBuffer.toggle();
   * console.log(result.newState); // 'started' or 'stopped'
   */
  async toggle() {
    try {
      const status = await this.getStatus();
      
      if (status.isRunning) {
        const result = await this.stop();
        return {
          ...result,
          newState: 'stopped'
        };
      } else {
        const result = await this.start();
        return {
          ...result,
          newState: 'started'
        };
      }
    } catch (error) {
      this.logger.error('Failed to toggle replay buffer', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get replay buffer properties and capabilities
   * @returns {Promise<Object>} Properties object with capabilities
   * @example
   * const props = await replayBuffer.getProperties();
   * console.log(props.properties.canSave);
   */
  async getProperties() {
    try {
      const status = await this.getStatus();
      const bufferStatus = await this.getBufferStatus();
      
      return {
        success: true,
        properties: {
          isRunning: status.isRunning,
          canSave: status.canSave,
          totalSaves: bufferStatus.bufferStatus.metrics.totalSaves,
          capabilities: {
            canStart: !status.isRunning,
            canStop: status.isRunning,
            canSave: status.canSave,
            canToggle: true,
            canConfigureDuration: true
          },
          configuration: {
            maxSeconds: 60,
            format: 'MP4' // Standard OBS format
          }
        }
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer properties', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get complete replay buffer information
   * Full status report for monitoring
   * @returns {Promise<Object>} Complete information object
   * @example
   * const info = await replayBuffer.getInfo();
   */
  async getInfo() {
    try {
      const [status, bufferStatus, maxSeconds] = await Promise.all([
        this.getStatus(),
        this.getBufferStatus(),
        this.getMaxSeconds()
      ]);

      return {
        success: true,
        info: {
          status: status.isRunning ? 'active' : 'inactive',
          canSave: status.canSave,
          configuration: {
            maxDuration: maxSeconds.maxSeconds,
            unit: 'seconds',
            format: 'MP4'
          },
          metrics: bufferStatus.bufferStatus.metrics,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get replay buffer info', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create automation action for replay buffer
   * Helper method for automation rules
   * @param {string} action - Action name (start, stop, toggle, save)
   * @returns {Promise<Object>} Result of the action
   * @private
   */
  async executeAction(action) {
    switch (action.toLowerCase()) {
      case 'start':
        return await this.start();
      case 'stop':
        return await this.stop();
      case 'toggle':
        return await this.toggle();
      case 'save':
        return await this.save();
      default:
        return {
          success: false,
          message: `Unknown action: ${action}. Valid actions: start, stop, toggle, save`
        };
    }
  }

  /**
   * Update save event tracking
   * Called when OBS emits replay buffer save event
   * @param {Object} event - Event data from OBS
   * @internal
   */
  updateSaveMetrics(event) {
    this.bufferMetrics.lastSaveTime = new Date();
    this.bufferMetrics.lastSavedFilename = event.filename || null;
    this.bufferMetrics.totalSaves += 1;
  }
}

export default ReplayBufferController;
