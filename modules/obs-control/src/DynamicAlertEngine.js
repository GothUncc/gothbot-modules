/**
 * Dynamic Alert Engine
 * Creates and manages dynamic OBS sources for alerts with queue management
 */

export class DynamicAlertEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.activeAlerts = new Map();
    this.alertQueue = [];
    this.processing = false;
    this.maxConcurrentAlerts = 3;
  }

  /**
   * Show an alert dynamically
   * @param {Object} config - Alert configuration
   * @returns {Promise<string>} Alert ID
   */
  async showAlert(config) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert = {
      id: alertId,
      type: config.type || 'generic',
      sourceName: `DynamicAlert_${alertId}`,
      sceneName: config.scene || null, // Will get current scene if null
      duration: config.duration || 5000,
      url: config.url || this.buildAlertUrl(config),
      width: config.width || 1920,
      height: config.height || 1080,
      config
    };

    this.context.logger.info('Alert queued', {
      id: alertId,
      type: alert.type,
      queueSize: this.alertQueue.length + 1
    });

    this.alertQueue.push(alert);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return alertId;
  }

  /**
   * Build alert overlay URL
   */
  buildAlertUrl(config) {
    const params = new URLSearchParams({
      type: config.type || 'generic',
      username: config.username || 'Viewer',
      message: config.message || '',
      amount: config.amount || '',
      duration: config.duration || 5000
    });

    // Assume bot is running on localhost:3000
    return `http://localhost:3000/overlay/alert?${params.toString()}`;
  }

  /**
   * Process alert queue
   */
  async processQueue() {
    if (this.processing || this.alertQueue.length === 0) {
      return;
    }

    // Check concurrent alert limit
    if (this.activeAlerts.size >= this.maxConcurrentAlerts) {
      this.context.logger.debug('Max concurrent alerts reached, waiting', {
        active: this.activeAlerts.size,
        queued: this.alertQueue.length
      });
      
      // Retry after a short delay
      setTimeout(() => this.processQueue(), 500);
      return;
    }

    this.processing = true;
    const alert = this.alertQueue.shift();

    try {
      // Get current scene if not specified
      if (!alert.sceneName) {
        alert.sceneName = await this.obsCore.getCurrentProgramScene();
      }

      this.context.logger.info('Displaying alert', {
        id: alert.id,
        type: alert.type,
        scene: alert.sceneName,
        duration: alert.duration
      });

      // 1. Create browser source for alert
      await this.obsCore.createBrowserSource(
        alert.sceneName,
        alert.sourceName,
        {
          url: alert.url,
          width: alert.width,
          height: alert.height,
          fps: 60,
          shutdown: true, // Shutdown source when not visible
          restart_when_active: false
        }
      );

      // 2. Show the source (make it visible)
      await this.obsCore.setSourceVisibility(alert.sceneName, alert.sourceName, true);

      // 3. Store active alert
      this.activeAlerts.set(alert.id, {
        ...alert,
        startTime: Date.now(),
        timeout: null
      });

      // 4. Schedule automatic removal after duration
      const timeout = setTimeout(async () => {
        await this.hideAlert(alert.id);
      }, alert.duration);

      this.activeAlerts.get(alert.id).timeout = timeout;

      this.context.logger.info('Alert displayed successfully', {
        id: alert.id,
        activeCount: this.activeAlerts.size
      });

    } catch (error) {
      this.context.logger.error('Failed to display alert', {
        id: alert.id,
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.processing = false;

      // Process next alert in queue
      if (this.alertQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Hide an alert (removes from OBS)
   * @param {string} alertId - Alert ID to hide
   */
  async hideAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      this.context.logger.warn('Alert not found for hiding', { alertId });
      return;
    }

    try {
      // Clear timeout if it exists
      if (alert.timeout) {
        clearTimeout(alert.timeout);
      }

      this.context.logger.info('Hiding alert', {
        id: alertId,
        displayTime: Date.now() - alert.startTime
      });

      // Hide source first
      await this.obsCore.setSourceVisibility(alert.sceneName, alert.sourceName, false);

      // Wait a moment for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove source from OBS
      await this.obsCore.removeSceneItem(alert.sceneName, alert.sourceName);

      this.activeAlerts.delete(alertId);

      this.context.logger.info('Alert removed successfully', {
        id: alertId,
        remainingActive: this.activeAlerts.size
      });

      // Continue processing queue if there are waiting alerts
      if (this.alertQueue.length > 0) {
        this.processQueue();
      }

    } catch (error) {
      this.context.logger.error('Failed to hide alert', {
        id: alertId,
        error: error.message,
        stack: error.stack
      });

      // Force remove from active list even if removal failed
      this.activeAlerts.delete(alertId);
    }
  }

  /**
   * Create a dynamic source (generic source creation)
   * @param {Object} config - Source configuration
   * @returns {Promise<string>} Source ID
   */
  async createDynamicSource(config) {
    const sourceId = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          throw new Error(`Unsupported source type: ${config.type}`);
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
        config
      });
      throw error;
    }
  }

  /**
   * Remove a dynamic source
   * @param {string} sourceId - Source ID to remove
   */
  async removeDynamicSource(sourceId) {
    // This is a simplified implementation
    // In production, you'd track created sources and their scene locations
    this.context.logger.warn('removeDynamicSource not fully implemented', { sourceId });
  }

  /**
   * Update a dynamic source
   * @param {string} sourceId - Source ID to update
   * @param {Object} updates - Updates to apply
   */
  async updateSource(sourceId, updates) {
    // This would update source settings
    this.context.logger.warn('updateSource not fully implemented', { sourceId, updates });
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      activeAlerts: this.activeAlerts.size,
      queuedAlerts: this.alertQueue.length,
      maxConcurrent: this.maxConcurrentAlerts,
      processing: this.processing
    };
  }

  /**
   * Cleanup all alerts and clear queue
   */
  async cleanup() {
    this.context.logger.info('Cleaning up alert engine', {
      activeAlerts: this.activeAlerts.size,
      queuedAlerts: this.alertQueue.length
    });

    // Clear queue
    this.alertQueue = [];

    // Remove all active alerts
    const alertIds = Array.from(this.activeAlerts.keys());
    for (const alertId of alertIds) {
      await this.hideAlert(alertId);
    }

    this.processing = false;

    this.context.logger.info('Alert engine cleanup complete');
  }
}
