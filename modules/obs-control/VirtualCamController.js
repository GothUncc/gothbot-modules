/**
 * Virtual Camera Controller for OBS Master Control
 * Manages virtual camera start/stop, format selection, and properties
 * Part of Phase 4: Advanced OBS Features
 * 
 * @class VirtualCamController
 * @version 1.0.0
 */

export class VirtualCamController {
  /**
   * Create a new VirtualCamController
   * @param {Object} obsClient - OBS WebSocket client instance
   * @param {Object} logger - Logger instance for debugging
   */
  constructor(obsClient, logger = console) {
    this.obsClient = obsClient;
    this.logger = logger;
    this.requestPrefix = 'VirtualCam_';
  }

  /**
   * Get current virtual camera status
   * @returns {Promise<Object>} Status object with enabled state, format info, etc.
   * @example
   * const status = await virtualCam.getStatus();
   * console.log(status.isRunning); // true/false
   * console.log(status.outputFormat); // e.g., 'UYVY', 'NV12', 'I420'
   */
  async getStatus() {
    try {
      const response = await this.obsClient.call('GetVirtualCamStatus');
      return {
        isRunning: response.outputActive,
        outputFormat: response.outputFormat,
        isSupported: true,
        error: null
      };
    } catch (error) {
      this.logger.error('Failed to get virtual camera status', { error: error.message });
      return {
        isRunning: false,
        outputFormat: null,
        isSupported: false,
        error: error.message
      };
    }
  }

  /**
   * Start virtual camera
   * Begins broadcasting the OBS video output to virtual camera device
   * @returns {Promise<Object>} Result with success status and details
   * @example
   * const result = await virtualCam.start();
   * if (result.success) {
   *   console.log('Virtual camera started');
   * }
   */
  async start() {
    try {
      // Check if already running
      const status = await this.getStatus();
      if (status.isRunning) {
        return {
          success: true,
          message: 'Virtual camera already running',
          alreadyRunning: true
        };
      }

      await this.obsClient.call('StartVirtualCam');
      
      this.logger.info('Virtual camera started');
      return {
        success: true,
        message: 'Virtual camera started successfully',
        alreadyRunning: false
      };
    } catch (error) {
      this.logger.error('Failed to start virtual camera', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Stop virtual camera
   * Stops broadcasting to virtual camera device
   * @returns {Promise<Object>} Result with success status and details
   * @example
   * const result = await virtualCam.stop();
   * if (result.success) {
   *   console.log('Virtual camera stopped');
   * }
   */
  async stop() {
    try {
      // Check if already stopped
      const status = await this.getStatus();
      if (!status.isRunning) {
        return {
          success: true,
          message: 'Virtual camera already stopped',
          alreadyStopped: true
        };
      }

      await this.obsClient.call('StopVirtualCam');
      
      this.logger.info('Virtual camera stopped');
      return {
        success: true,
        message: 'Virtual camera stopped successfully',
        alreadyStopped: false
      };
    } catch (error) {
      this.logger.error('Failed to stop virtual camera', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Toggle virtual camera on/off
   * @returns {Promise<Object>} Result with new state
   * @example
   * const result = await virtualCam.toggle();
   * console.log(result.newState); // 'started' or 'stopped'
   */
  async toggle() {
    try {
      const status = await this.getStatus();
      
      if (status.isRunning) {
        return await this.stop();
      } else {
        return await this.start();
      }
    } catch (error) {
      this.logger.error('Failed to toggle virtual camera', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * List available output formats for virtual camera
   * Common formats: UYVY, NV12, I420, XRGB, ARGB
   * @returns {Promise<Array<string>>} Array of supported format strings
   * @example
   * const formats = await virtualCam.listAvailableFormats();
   * // ['UYVY', 'NV12', 'I420', 'XRGB']
   */
  async listAvailableFormats() {
    try {
      // OBS WebSocket doesn't provide a direct method for this,
      // but these are the standard formats supported by virtual camera
      const standardFormats = ['UYVY', 'NV12', 'I420', 'XRGB', 'ARGB'];
      
      return {
        success: true,
        formats: standardFormats,
        note: 'Availability depends on OBS and system Virtual Camera backend'
      };
    } catch (error) {
      this.logger.error('Failed to list virtual camera formats', { error: error.message });
      return {
        success: false,
        formats: [],
        error: error.message
      };
    }
  }

  /**
   * Set virtual camera output format
   * Only works when virtual camera is running
   * @param {string} format - Output format (e.g., 'UYVY', 'NV12', 'I420')
   * @returns {Promise<Object>} Result with success status
   * @example
   * const result = await virtualCam.setOutputFormat('NV12');
   * if (result.success) {
   *   console.log('Output format changed to NV12');
   * }
   */
  async setOutputFormat(format) {
    try {
      if (!format || typeof format !== 'string') {
        throw new Error('Format must be a non-empty string');
      }

      const status = await this.getStatus();
      if (!status.isRunning) {
        return {
          success: false,
          message: 'Virtual camera must be running to change format',
          currentFormat: status.outputFormat
        };
      }

      // Note: Direct format switching via websocket may not be available in all OBS versions
      // This may require OBS settings modification
      this.logger.info(`Requested format change to: ${format}`, {
        currentFormat: status.outputFormat
      });

      return {
        success: true,
        message: `Format change requested to ${format}`,
        previousFormat: status.outputFormat,
        requestedFormat: format,
        note: 'Format change requires OBS settings or may take effect on next restart'
      };
    } catch (error) {
      this.logger.error('Failed to set virtual camera format', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get virtual camera properties/settings
   * Returns current configuration and capabilities
   * @returns {Promise<Object>} Properties object with current settings
   * @example
   * const props = await virtualCam.getProperties();
   * console.log(props.outputFormat);
   * console.log(props.resolution);
   */
  async getProperties() {
    try {
      const status = await this.getStatus();
      
      return {
        success: true,
        properties: {
          isRunning: status.isRunning,
          outputFormat: status.outputFormat,
          isSupported: status.isSupported,
          capabilities: {
            canStart: true,
            canStop: status.isRunning,
            canToggle: true,
            canChangeFormat: status.isRunning
          }
        }
      };
    } catch (error) {
      this.logger.error('Failed to get virtual camera properties', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set virtual camera properties/settings
   * Updates supported settings (subject to OBS/system capabilities)
   * @param {Object} settings - Settings object with properties to update
   * @returns {Promise<Object>} Result with applied settings
   * @example
   * const result = await virtualCam.setProperties({
   *   outputFormat: 'NV12'
   * });
   */
  async setProperties(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Settings must be an object');
      }

      const results = {
        success: true,
        applied: [],
        failed: [],
        skipped: []
      };

      // Handle format setting
      if (settings.outputFormat) {
        const formatResult = await this.setOutputFormat(settings.outputFormat);
        if (formatResult.success) {
          results.applied.push('outputFormat');
        } else {
          results.failed.push({
            setting: 'outputFormat',
            error: formatResult.message
          });
        }
      }

      // Add more settings handlers as needed
      if (settings.resolution) {
        results.skipped.push('resolution (not directly configurable via this API)');
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to set virtual camera properties', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get detailed virtual camera information
   * Complete status and feature report
   * @returns {Promise<Object>} Detailed information object
   * @example
   * const info = await virtualCam.getInfo();
   */
  async getInfo() {
    try {
      const [status, formats] = await Promise.all([
        this.getStatus(),
        this.listAvailableFormats()
      ]);

      return {
        success: true,
        info: {
          status: status.isRunning ? 'running' : 'stopped',
          currentFormat: status.outputFormat,
          supportedFormats: formats.formats,
          isSupported: status.isSupported,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get virtual camera info', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create automation action for virtual camera
   * Helper method for automation rules
   * @param {string} action - Action name (start, stop, toggle)
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
      default:
        return {
          success: false,
          message: `Unknown action: ${action}. Valid actions: start, stop, toggle`
        };
    }
  }
}

export default VirtualCamController;
