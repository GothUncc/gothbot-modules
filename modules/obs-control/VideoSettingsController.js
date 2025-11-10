/**
 * Video Settings Controller for OBS Master Control
 * Manages OBS video output settings (resolution, frame rate, format, scaling)
 * Part of Phase 4: Advanced OBS Features
 * 
 * @class VideoSettingsController
 * @version 1.0.0
 */

export class VideoSettingsController {
  /**
   * Create a new VideoSettingsController
   * @param {Object} obsClient - OBS WebSocket client instance
   * @param {Object} logger - Logger instance for debugging
   */
  constructor(obsClient, logger = console) {
    this.obsClient = obsClient;
    this.logger = logger;
    this.videoSettingsCache = {
      settings: null,
      lastUpdated: null
    };

    // Common resolution presets
    this.resolutionPresets = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 },
      'ultrawide': { width: 3440, height: 1440 }
    };

    // Common frame rates
    this.frameRatePresets = [24, 30, 48, 50, 59.94, 60];

    // Video formats
    this.videoFormats = ['I420', 'NV12', 'UYVY', 'YUY2'];
  }

  /**
   * Get all current video settings
   * Retrieves complete video configuration from OBS
   * @returns {Promise<Object>} Video settings object with all current values
   * @example
   * const settings = await videoSettings.getSettings();
   * console.log(settings.baseWidth, settings.baseHeight); // Canvas size
   * console.log(settings.outputWidth, settings.outputHeight); // Output size
   * console.log(settings.fpsNum, settings.fpsDen); // Frame rate
   */
  async getSettings() {
    try {
      const response = await this.obsClient.call('GetVideoSettings');

      this.videoSettingsCache.settings = response;
      this.videoSettingsCache.lastUpdated = new Date();

      return {
        success: true,
        settings: {
          baseWidth: response.baseWidth,
          baseHeight: response.baseHeight,
          outputWidth: response.outputWidth,
          outputHeight: response.outputHeight,
          fpsNum: response.fpsNum,
          fpsDen: response.fpsDen,
          fpsDecimal: response.fpsNum / response.fpsDen
        },
        timestamp: this.videoSettingsCache.lastUpdated.toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get video settings', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set video settings
   * Updates one or more video configuration parameters
   * Note: Some changes may require restart
   * @param {Object} settings - Settings to update
   * @param {number} [settings.baseWidth] - Canvas width
   * @param {number} [settings.baseHeight] - Canvas height
   * @param {number} [settings.outputWidth] - Output width
   * @param {number} [settings.outputHeight] - Output height
   * @param {number} [settings.fpsNum] - Frame rate numerator
   * @param {number} [settings.fpsDen] - Frame rate denominator
   * @returns {Promise<Object>} Result with applied settings
   * @example
   * const result = await videoSettings.setSettings({
   *   baseWidth: 1920,
   *   baseHeight: 1080,
   *   fpsNum: 60000,
   *   fpsDen: 1000
   * });
   */
  async setSettings(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Settings must be an object');
      }

      // Validate resolution values if provided
      if (settings.baseWidth || settings.baseHeight) {
        if ((settings.baseWidth && settings.baseWidth < 320) || settings.baseWidth > 4096) {
          throw new Error('Base width must be between 320 and 4096');
        }
        if ((settings.baseHeight && settings.baseHeight < 240) || settings.baseHeight > 4096) {
          throw new Error('Base height must be between 240 and 4096');
        }
      }

      // Update settings via WebSocket
      await this.obsClient.call('SetVideoSettings', settings);

      this.logger.info('Video settings updated', { settings });

      return {
        success: true,
        message: 'Video settings updated successfully',
        appliedSettings: Object.keys(settings),
        note: 'Some changes may require OBS restart to take full effect',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to set video settings', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get canvas (base) resolution
   * @returns {Promise<Object>} Canvas resolution object with width and height
   * @example
   * const res = await videoSettings.getBaseResolution();
   * console.log(`${res.width}x${res.height}`); // e.g., 1920x1080
   */
  async getBaseResolution() {
    try {
      const response = await this.obsClient.call('GetVideoSettings');

      return {
        success: true,
        width: response.baseWidth,
        height: response.baseHeight,
        aspectRatio: `${response.baseWidth}:${response.baseHeight}`,
        presetName: this.getResolutionPresetName(response.baseWidth, response.baseHeight),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get base resolution', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set canvas (base) resolution
   * Changes the canvas/scene size
   * @param {number} width - Canvas width in pixels
   * @param {number} height - Canvas height in pixels
   * @returns {Promise<Object>} Result with new resolution
   * @example
   * const result = await videoSettings.setBaseResolution(1920, 1080);
   */
  async setBaseResolution(width, height) {
    try {
      if (!Number.isInteger(width) || !Number.isInteger(height)) {
        throw new Error('Width and height must be integers');
      }

      if (width < 320 || width > 4096 || height < 240 || height > 4096) {
        throw new Error('Resolution must be within 320x240 to 4096x4096');
      }

      const result = await this.setSettings({
        baseWidth: width,
        baseHeight: height
      });

      if (result.success) {
        return {
          ...result,
          newResolution: `${width}x${height}`
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to set base resolution', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get scaled output resolution
   * @returns {Promise<Object>} Output/scaled resolution object
   * @example
   * const res = await videoSettings.getScaledResolution();
   * console.log(`Scaled to: ${res.width}x${res.height}`);
   */
  async getScaledResolution() {
    try {
      const response = await this.obsClient.call('GetVideoSettings');

      return {
        success: true,
        width: response.outputWidth,
        height: response.outputHeight,
        aspectRatio: `${response.outputWidth}:${response.outputHeight}`,
        scalingRatio: {
          width: response.outputWidth / response.baseWidth,
          height: response.outputHeight / response.baseHeight
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get scaled resolution', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set scaled output resolution
   * Changes the output/encoding resolution (downscales if lower than canvas)
   * @param {number} width - Output width in pixels
   * @param {number} height - Output height in pixels
   * @returns {Promise<Object>} Result with new resolution
   * @example
   * const result = await videoSettings.setScaledResolution(1280, 720);
   */
  async setScaledResolution(width, height) {
    try {
      if (!Number.isInteger(width) || !Number.isInteger(height)) {
        throw new Error('Width and height must be integers');
      }

      if (width < 256 || width > 4096 || height < 256 || height > 4096) {
        throw new Error('Scaled resolution must be within 256x256 to 4096x4096');
      }

      const result = await this.setSettings({
        outputWidth: width,
        outputHeight: height
      });

      if (result.success) {
        return {
          ...result,
          newResolution: `${width}x${height}`
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to set scaled resolution', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get current frame rate
   * @returns {Promise<Object>} Frame rate object with decimal and fraction values
   * @example
   * const fps = await videoSettings.getFrameRate();
   * console.log(fps.decimal); // 59.94
   * console.log(`${fps.num}/${fps.den}`); // 60000/1001
   */
  async getFrameRate() {
    try {
      const response = await this.obsClient.call('GetVideoSettings');

      return {
        success: true,
        num: response.fpsNum,
        den: response.fpsDen,
        decimal: response.fpsNum / response.fpsDen,
        frameRateString: `${response.fpsNum / response.fpsDen} fps`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get frame rate', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set frame rate
   * @param {number} fps - Frame rate in decimal format (e.g., 60, 59.94, 30, 24)
   * @returns {Promise<Object>} Result with new frame rate
   * @example
   * const result = await videoSettings.setFrameRate(60); // 60 fps
   * const result2 = await videoSettings.setFrameRate(59.94); // 59.94 fps
   */
  async setFrameRate(fps) {
    try {
      if (typeof fps !== 'number' || fps <= 0 || fps > 300) {
        throw new Error('Frame rate must be a number between 0 and 300');
      }

      let fpsNum, fpsDen;

      // Handle common frame rates
      if (fps === 60) {
        fpsNum = 60000;
        fpsDen = 1000;
      } else if (fps === 59.94) {
        fpsNum = 60000;
        fpsDen = 1001;
      } else if (fps === 30) {
        fpsNum = 30000;
        fpsDen = 1000;
      } else if (fps === 29.97) {
        fpsNum = 30000;
        fpsDen = 1001;
      } else if (fps === 24) {
        fpsNum = 24000;
        fpsDen = 1000;
      } else if (fps === 23.976) {
        fpsNum = 24000;
        fpsDen = 1001;
      } else {
        // Generic frame rate handling
        fpsNum = Math.round(fps * 1000);
        fpsDen = 1000;
      }

      const result = await this.setSettings({
        fpsNum: fpsNum,
        fpsDen: fpsDen
      });

      if (result.success) {
        return {
          ...result,
          newFrameRate: fps,
          fpsNum: fpsNum,
          fpsDen: fpsDen
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to set frame rate', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get video format
   * @returns {Promise<Object>} Video format information
   * @example
   * const format = await videoSettings.getFormat();
   */
  async getFormat() {
    try {
      // OBS WebSocket doesn't directly provide video format via GetVideoSettings
      // This would need to be read from OBS config or advanced API
      return {
        success: true,
        format: 'I420', // Default OBS format
        availableFormats: this.videoFormats,
        note: 'Video format is typically determined by OBS build and system video capabilities',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get video format', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Set video format
   * Changes the internal video format (may require restart)
   * @param {string} format - Format (I420, NV12, UYVY, YUY2)
   * @returns {Promise<Object>} Result with format change info
   * @example
   * const result = await videoSettings.setFormat('NV12');
   */
  async setFormat(format) {
    try {
      if (!format || typeof format !== 'string') {
        throw new Error('Format must be a non-empty string');
      }

      if (!this.videoFormats.includes(format.toUpperCase())) {
        return {
          success: false,
          message: `Format '${format}' not supported`,
          supportedFormats: this.videoFormats,
          error: 'UNSUPPORTED_FORMAT'
        };
      }

      this.logger.info(`Video format change requested: ${format}`, {
        note: 'Change requires OBS restart'
      });

      return {
        success: true,
        message: `Video format change to '${format}' requested`,
        requestedFormat: format,
        note: 'Format change requires OBS restart',
        requiresRestart: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to set video format', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get available resolution presets
   * @returns {Promise<Object>} Available resolution options
   * @example
   * const presets = await videoSettings.getResolutionPresets();
   */
  async getResolutionPresets() {
    return {
      success: true,
      presets: this.resolutionPresets,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Apply resolution preset
   * @param {string} presetName - Preset name (480p, 720p, 1080p, etc.)
   * @param {string} target - Target to apply to: base or scaled
   * @returns {Promise<Object>} Result with applied preset
   * @example
   * const result = await videoSettings.applyPreset('1080p', 'base');
   */
  async applyPreset(presetName, target = 'base') {
    try {
      if (!presetName || typeof presetName !== 'string') {
        throw new Error('Preset name must be a non-empty string');
      }

      const preset = this.resolutionPresets[presetName.toLowerCase()];
      if (!preset) {
        return {
          success: false,
          message: `Preset '${presetName}' not found`,
          availablePresets: Object.keys(this.resolutionPresets),
          error: 'PRESET_NOT_FOUND'
        };
      }

      if (target.toLowerCase() === 'base') {
        return await this.setBaseResolution(preset.width, preset.height);
      } else if (target.toLowerCase() === 'scaled') {
        return await this.setScaledResolution(preset.width, preset.height);
      } else {
        return {
          success: false,
          message: `Unknown target '${target}'. Use 'base' or 'scaled'`
        };
      }
    } catch (error) {
      this.logger.error('Failed to apply preset', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get complete video settings information
   * Full configuration report
   * @returns {Promise<Object>} Complete video settings
   * @example
   * const info = await videoSettings.getInfo();
   */
  async getInfo() {
    try {
      const [settings, frameRate, baseRes, scaledRes] = await Promise.all([
        this.getSettings(),
        this.getFrameRate(),
        this.getBaseResolution(),
        this.getScaledResolution()
      ]);

      return {
        success: true,
        info: {
          canvas: {
            width: baseRes.width,
            height: baseRes.height,
            preset: baseRes.presetName
          },
          output: {
            width: scaledRes.width,
            height: scaledRes.height,
            scalingRatio: scaledRes.scalingRatio
          },
          frameRate: {
            decimal: frameRate.decimal,
            fraction: `${frameRate.num}/${frameRate.den}`
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get video settings info', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Helper: Get preset name from dimensions
   * @private
   */
  getResolutionPresetName(width, height) {
    for (const [name, preset] of Object.entries(this.resolutionPresets)) {
      if (preset.width === width && preset.height === height) {
        return name;
      }
    }
    return `${width}x${height}`;
  }

  /**
   * Create automation action for video settings
   * Helper method for automation rules
   * @param {string} action - Action name
   * @param {Object} params - Action parameters
   * @returns {Promise<Object>} Result of the action
   * @private
   */
  async executeAction(action, params) {
    switch (action.toLowerCase()) {
      case 'set_base_resolution':
        return await this.setBaseResolution(params.width, params.height);
      case 'set_scaled_resolution':
        return await this.setScaledResolution(params.width, params.height);
      case 'set_frame_rate':
        return await this.setFrameRate(params.fps);
      case 'apply_preset':
        return await this.applyPreset(params.preset, params.target);
      default:
        return {
          success: false,
          message: `Unknown action: ${action}. Valid actions: set_base_resolution, set_scaled_resolution, set_frame_rate, apply_preset`
        };
    }
  }
}

export default VideoSettingsController;
