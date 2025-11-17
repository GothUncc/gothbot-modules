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
        hasAPI: !!this.obsCore
      });

      if (this.obsCore) {
        // Check if OBS is connected via Core's API
        this.connected = this.obsCore.isConnected();
        
        this.logger.info('Using Core OBS WebSocket API', {
          connected: this.connected
        });
        
        if (this.connected) {
          this.emit('connected');
        }
      } else {
        this.logger.error('No OBS API available from Core - module cannot function');
        this.connected = false;
      }
      
      this.logger.info('OBS Module Core initialized', {
        connected: this.connected
      });
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

  // Audio Mixer Control
  async setInputVolume(inputName, volumeDb) {
    this.ensureConnected();
    await this.obsCore.call('SetInputVolume', { inputName, inputVolumeDb: volumeDb });
    this.logger.info('Input volume set', { input: inputName, volumeDb });
  }

  async getInputVolume(inputName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetInputVolume', { inputName });
    return response;
  }

  async setInputMute(inputName, inputMuted) {
    this.ensureConnected();
    await this.obsCore.call('SetInputMute', { inputName, inputMuted });
    this.logger.info('Input mute set', { input: inputName, muted: inputMuted });
  }

  async getInputMute(inputName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetInputMute', { inputName });
    return response.inputMuted;
  }

  async toggleInputMute(inputName) {
    this.ensureConnected();
    await this.obsCore.call('ToggleInputMute', { inputName });
    this.logger.info('Input mute toggled', { input: inputName });
  }

  async setInputAudioMonitorType(inputName, monitorType) {
    this.ensureConnected();
    await this.obsCore.call('SetInputAudioMonitorType', { inputName, monitorType });
    this.logger.info('Audio monitor type set', { input: inputName, monitorType });
  }

  // Scene & Scene Items
  async createScene(sceneName) {
    this.ensureConnected();
    await this.obsCore.call('CreateScene', { sceneName });
    this.logger.info('Scene created', { sceneName });
  }

  async removeScene(sceneName) {
    this.ensureConnected();
    await this.obsCore.call('RemoveScene', { sceneName });
    this.logger.info('Scene removed', { sceneName });
  }

  async getSceneItemList(sceneName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSceneItemList', { sceneName });
    return response.sceneItems;
  }

  async setSceneItemEnabled(sceneName, sceneItemId, sceneItemEnabled) {
    this.ensureConnected();
    await this.obsCore.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
    this.logger.info('Scene item enabled state set', { sceneName, sceneItemId, enabled: sceneItemEnabled });
  }

  async setSceneItemTransform(sceneName, sceneItemId, transform) {
    this.ensureConnected();
    await this.obsCore.call('SetSceneItemTransform', { sceneName, sceneItemId, sceneItemTransform: transform });
    this.logger.info('Scene item transform set', { sceneName, sceneItemId });
  }

  async getSceneItemTransform(sceneName, sceneItemId) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSceneItemTransform', { sceneName, sceneItemId });
    return response.sceneItemTransform;
  }

  async getInputList() {
    this.ensureConnected();
    const response = await this.obsCore.call('GetInputList');
    return response.inputs;
  }

  async getSourceActive(sourceName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSourceActive', { sourceName });
    return response;
  }

  // Streaming & Recording Extensions
  async toggleStream() {
    this.ensureConnected();
    await this.obsCore.call('ToggleStream');
    this.logger.info('Stream toggled');
  }

  async toggleRecord() {
    this.ensureConnected();
    await this.obsCore.call('ToggleRecord');
    this.logger.info('Recording toggled');
  }

  async pauseRecord() {
    this.ensureConnected();
    await this.obsCore.call('PauseRecord');
    this.logger.info('Recording paused');
  }

  async resumeRecord() {
    this.ensureConnected();
    await this.obsCore.call('ResumeRecord');
    this.logger.info('Recording resumed');
  }

  // Filters
  async createSourceFilter(sourceName, filterName, filterKind, filterSettings) {
    this.ensureConnected();
    await this.obsCore.call('CreateSourceFilter', { sourceName, filterName, filterKind, filterSettings });
    this.logger.info('Source filter created', { sourceName, filterName, filterKind });
  }

  async removeSourceFilter(sourceName, filterName) {
    this.ensureConnected();
    await this.obsCore.call('RemoveSourceFilter', { sourceName, filterName });
    this.logger.info('Source filter removed', { sourceName, filterName });
  }

  async setSourceFilterEnabled(sourceName, filterName, filterEnabled) {
    this.ensureConnected();
    await this.obsCore.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
    this.logger.info('Source filter enabled state set', { sourceName, filterName, enabled: filterEnabled });
  }

  async getSourceFilterList(sourceName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSourceFilterList', { sourceName });
    return response.filters;
  }

  async setSourceFilterSettings(sourceName, filterName, filterSettings) {
    this.ensureConnected();
    await this.obsCore.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings });
    this.logger.info('Source filter settings updated', { sourceName, filterName });
  }

  // Inputs
  async createInput(sceneName, inputName, inputKind, inputSettings) {
    this.ensureConnected();
    await this.obsCore.call('CreateInput', { sceneName, inputName, inputKind, inputSettings });
    this.logger.info('Input created', { sceneName, inputName, inputKind });
  }

  async removeInput(inputName) {
    this.ensureConnected();
    await this.obsCore.call('RemoveInput', { inputName });
    this.logger.info('Input removed', { inputName });
  }

  async setInputSettings(inputName, inputSettings) {
    this.ensureConnected();
    await this.obsCore.call('SetInputSettings', { inputName, inputSettings });
    this.logger.info('Input settings updated', { inputName });
  }

  async getInputSettings(inputName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetInputSettings', { inputName });
    return response;
  }

  async setInputName(inputName, newInputName) {
    this.ensureConnected();
    await this.obsCore.call('SetInputName', { inputName, newInputName });
    this.logger.info('Input renamed', { oldName: inputName, newName: newInputName });
  }

  // Transitions & Studio Mode
  async getSceneTransitionList() {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSceneTransitionList');
    return response;
  }

  async getCurrentSceneTransition() {
    this.ensureConnected();
    const response = await this.obsCore.call('GetCurrentSceneTransition');
    return response;
  }

  async setCurrentSceneTransition(transitionName) {
    this.ensureConnected();
    await this.obsCore.call('SetCurrentSceneTransition', { transitionName });
    this.logger.info('Scene transition set', { transitionName });
  }

  async setCurrentSceneTransitionDuration(transitionDuration) {
    this.ensureConnected();
    await this.obsCore.call('SetCurrentSceneTransitionDuration', { transitionDuration });
    this.logger.info('Scene transition duration set', { transitionDuration });
  }

  async getStudioModeEnabled() {
    this.ensureConnected();
    const response = await this.obsCore.call('GetStudioModeEnabled');
    return response.studioModeEnabled;
  }

  async setStudioModeEnabled(studioModeEnabled) {
    this.ensureConnected();
    await this.obsCore.call('SetStudioModeEnabled', { studioModeEnabled });
    this.logger.info('Studio mode set', { enabled: studioModeEnabled });
  }

  async triggerStudioModeTransition() {
    this.ensureConnected();
    await this.obsCore.call('TriggerStudioModeTransition');
    this.logger.info('Studio mode transition triggered');
  }

  // Screenshots
  async saveSourceScreenshot(sourceName, imageFormat, imageFilePath) {
    this.ensureConnected();
    await this.obsCore.call('SaveSourceScreenshot', { sourceName, imageFormat, imageFilePath });
    this.logger.info('Screenshot saved', { sourceName, imageFilePath });
  }

  async getSourceScreenshot(sourceName, imageFormat) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSourceScreenshot', { sourceName, imageFormat });
    return response.imageData;
  }

  // Text Sources & Visibility
  async setInputText(inputName, inputText) {
    this.ensureConnected();
    await this.obsCore.call('SetInputSettings', { inputName, inputSettings: { text: inputText } });
    this.logger.info('Text input updated', { inputName });
  }

  async getSceneItemId(sceneName, sourceName) {
    this.ensureConnected();
    const response = await this.obsCore.call('GetSceneItemId', { sceneName, sourceName });
    return response.sceneItemId;
  }

  async setSceneItemLocked(sceneName, sceneItemId, sceneItemLocked) {
    this.ensureConnected();
    await this.obsCore.call('SetSceneItemLocked', { sceneName, sceneItemId, sceneItemLocked });
    this.logger.info('Scene item lock state set', { sceneName, sceneItemId, locked: sceneItemLocked });
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
 * Load saved automation rules from storage
 */
async function loadSavedRules(context) {
  try {
    const savedRules = await context.storage.get('automation_rules');
    if (savedRules && Array.isArray(savedRules)) {
      for (let i = 0; i < savedRules.length; i++) {
        try {
          automationEngine.registerRule(savedRules[i]);
        } catch (error) {
          context.logger.error('Failed to load saved rule', {
            rule: savedRules[i],
            error: error.message
          });
        }
      }
      context.logger.info('Loaded saved automation rules', { count: savedRules.length });
    }
  } catch (error) {
    context.logger.error('Failed to load automation rules from storage', {
      error: error.message
    });
  }
}

/**
 * Save automation rules to storage
 */
async function saveRulesToStorage(context) {
  try {
    const rules = automationEngine.getRules();
    await context.storage.set('automation_rules', rules);
    context.logger.debug('Automation rules saved to storage', { count: rules.length });
  } catch (error) {
    context.logger.error('Failed to save automation rules', {
      error: error.message
    });
  }
}

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
 * Test alert function - for testing the alert system
 */
async function testAlert(context, type) {
  const alertType = type || 'follow';
  
  const testConfigs = {
    follow: {
      type: 'follow',
      username: 'TestViewer',
      message: 'TestViewer just followed!',
      duration: 5000
    },
    subscribe: {
      type: 'subscribe',
      username: 'TestSubscriber',
      message: 'TestSubscriber just subscribed!',
      duration: 5000
    },
    raid: {
      type: 'raid',
      username: 'TestRaider',
      message: 'TestRaider is raiding with 50 viewers!',
      duration: 5000
    },
    donation: {
      type: 'donation',
      username: 'TestDonor',
      message: 'TestDonor donated $5.00!',
      amount: 5.00,
      duration: 5000
    }
  };

  const config = testConfigs[alertType] || testConfigs.follow;
  
  if (!alertEngine) {
    return { error: 'Alert engine not initialized' };
  }

  const alertId = await alertEngine.showAlert(config);
  
  context.logger.info('Test alert triggered', {
    type: alertType,
    alertId: alertId
  });

  return {
    success: true,
    alertId: alertId,
    message: 'Test ' + alertType + ' alert queued'
  };
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
    },

    // Audio Mixer API
    setInputVolume: async function(inputName, volumeDb) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputVolume(inputName, volumeDb);
    },

    getInputVolume: async function(inputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getInputVolume(inputName);
    },

    setInputMute: async function(inputName, inputMuted) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputMute(inputName, inputMuted);
    },

    getInputMute: async function(inputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getInputMute(inputName);
    },

    toggleInputMute: async function(inputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.toggleInputMute(inputName);
    },

    setInputAudioMonitorType: async function(inputName, monitorType) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputAudioMonitorType(inputName, monitorType);
    },

    // Scene Management API
    createScene: async function(sceneName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.createScene(sceneName);
    },

    removeScene: async function(sceneName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.removeScene(sceneName);
    },

    getSceneItemList: async function(sceneName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSceneItemList(sceneName);
    },

    setSceneItemEnabled: async function(sceneName, sceneItemId, sceneItemEnabled) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSceneItemEnabled(sceneName, sceneItemId, sceneItemEnabled);
    },

    setSceneItemTransform: async function(sceneName, sceneItemId, transform) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSceneItemTransform(sceneName, sceneItemId, transform);
    },

    getSceneItemTransform: async function(sceneName, sceneItemId) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSceneItemTransform(sceneName, sceneItemId);
    },

    getInputList: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getInputList();
    },

    getSourceActive: async function(sourceName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSourceActive(sourceName);
    },

    // Streaming & Recording Extensions
    toggleStreaming: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.toggleStream();
    },

    toggleRecording: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.toggleRecord();
    },

    pauseRecording: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.pauseRecord();
    },

    resumeRecording: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.resumeRecord();
    },

    // Filter API
    createSourceFilter: async function(sourceName, filterName, filterKind, filterSettings) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.createSourceFilter(sourceName, filterName, filterKind, filterSettings);
    },

    removeSourceFilter: async function(sourceName, filterName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.removeSourceFilter(sourceName, filterName);
    },

    setSourceFilterEnabled: async function(sourceName, filterName, filterEnabled) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSourceFilterEnabled(sourceName, filterName, filterEnabled);
    },

    getSourceFilterList: async function(sourceName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSourceFilterList(sourceName);
    },

    setSourceFilterSettings: async function(sourceName, filterName, filterSettings) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSourceFilterSettings(sourceName, filterName, filterSettings);
    },

    // Input API
    createInput: async function(sceneName, inputName, inputKind, inputSettings) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.createInput(sceneName, inputName, inputKind, inputSettings);
    },

    removeInput: async function(inputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.removeInput(inputName);
    },

    setInputSettings: async function(inputName, inputSettings) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputSettings(inputName, inputSettings);
    },

    getInputSettings: async function(inputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getInputSettings(inputName);
    },

    setInputName: async function(inputName, newInputName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputName(inputName, newInputName);
    },

    // Transition & Studio Mode API
    getSceneTransitionList: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSceneTransitionList();
    },

    getCurrentSceneTransition: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getCurrentSceneTransition();
    },

    setCurrentSceneTransition: async function(transitionName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setCurrentSceneTransition(transitionName);
    },

    setCurrentSceneTransitionDuration: async function(transitionDuration) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setCurrentSceneTransitionDuration(transitionDuration);
    },

    getStudioModeEnabled: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getStudioModeEnabled();
    },

    setStudioModeEnabled: async function(studioModeEnabled) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setStudioModeEnabled(studioModeEnabled);
    },

    triggerStudioModeTransition: async function() {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.triggerStudioModeTransition();
    },

    // Screenshot API
    saveSourceScreenshot: async function(sourceName, imageFormat, imageFilePath) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.saveSourceScreenshot(sourceName, imageFormat, imageFilePath);
    },

    getSourceScreenshot: async function(sourceName, imageFormat) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSourceScreenshot(sourceName, imageFormat);
    },

    // Text & Visibility API
    setInputText: async function(inputName, inputText) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setInputText(inputName, inputText);
    },

    getSceneItemId: async function(sceneName, sourceName) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.getSceneItemId(sceneName, sourceName);
    },

    setSceneItemLocked: async function(sceneName, sceneItemId, sceneItemLocked) {
      if (!obsServices) throw new Error('OBS services not initialized');
      return await obsServices.setSceneItemLocked(sceneName, sceneItemId, sceneItemLocked);
    }
  };
}

// ============================================================================
// Web UI Integration Functions
// ============================================================================

/**
 * Register all API routes for the web UI
 */
function registerAPIRoutes(context, obsServices, automationEngine) {
  // IMPORTANT: Routes registered WITHOUT /modules/obs-master-control prefix
  // Core automatically prepends that when mounting module routes
  // So '/api/obs/status' becomes '/modules/obs-master-control/api/obs/status'
  
  // Status endpoint
  context.web.registerRoute('GET', '/api/obs/status', async function(req, res) {
    try {
      const status = await obsServices.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profile endpoints
  context.web.registerRoute('GET', '/api/obs/profiles', async function(req, res) {
    try {
      if (!obsServices.ProfileController) {
        return res.status(503).json({ error: 'Profile controller not available' });
      }
      const profiles = await obsServices.ProfileController.getProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/profiles', async function(req, res) {
    try {
      if (!obsServices.ProfileController) {
        return res.status(503).json({ error: 'Profile controller not available' });
      }
      const { profileName } = req.body;
      await obsServices.ProfileController.createProfile(profileName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Collection endpoints
  context.web.registerRoute('GET', '/api/obs/collections', async function(req, res) {
    try {
      if (!obsServices.SceneCollectionController) {
        return res.status(503).json({ error: 'Collection controller not available' });
      }
      const collections = await obsServices.SceneCollectionController.getCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/collections', async function(req, res) {
    try {
      if (!obsServices.SceneCollectionController) {
        return res.status(503).json({ error: 'Collection controller not available' });
      }
      const { collectionName } = req.body;
      await obsServices.SceneCollectionController.createCollection(collectionName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Video settings endpoints
  context.web.registerRoute('GET', '/api/obs/video-settings', async function(req, res) {
    try {
      if (!obsServices.VideoSettingsController) {
        return res.status(503).json({ error: 'Video settings controller not available' });
      }
      const settings = await obsServices.VideoSettingsController.getVideoSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/video-settings', async function(req, res) {
    try {
      if (!obsServices.VideoSettingsController) {
        return res.status(503).json({ error: 'Video settings controller not available' });
      }
      const { width, height, fps } = req.body;
      await obsServices.VideoSettingsController.setVideoSettings(width, height, fps);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Replay buffer endpoints
  context.web.registerRoute('GET', '/api/obs/replay-buffer', async function(req, res) {
    try {
      if (!obsServices.ReplayBufferController) {
        return res.status(503).json({ error: 'Replay buffer controller not available' });
      }
      const status = await obsServices.ReplayBufferController.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/replay-buffer/start', async function(req, res) {
    try {
      if (!obsServices.ReplayBufferController) {
        return res.status(503).json({ error: 'Replay buffer controller not available' });
      }
      await obsServices.ReplayBufferController.start();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/replay-buffer/stop', async function(req, res) {
    try {
      if (!obsServices.ReplayBufferController) {
        return res.status(503).json({ error: 'Replay buffer controller not available' });
      }
      await obsServices.ReplayBufferController.stop();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/replay-buffer/save', async function(req, res) {
    try {
      if (!obsServices.ReplayBufferController) {
        return res.status(503).json({ error: 'Replay buffer controller not available' });
      }
      await obsServices.ReplayBufferController.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Virtual camera endpoints
  context.web.registerRoute('GET', '/api/obs/virtual-camera', async function(req, res) {
    try {
      if (!obsServices.VirtualCamController) {
        return res.status(503).json({ error: 'Virtual camera controller not available' });
      }
      const status = await obsServices.VirtualCamController.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/virtual-camera/start', async function(req, res) {
    try {
      if (!obsServices.VirtualCamController) {
        return res.status(503).json({ error: 'Virtual camera controller not available' });
      }
      await obsServices.VirtualCamController.start();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/virtual-camera/stop', async function(req, res) {
    try {
      if (!obsServices.VirtualCamController) {
        return res.status(503).json({ error: 'Virtual camera controller not available' });
      }
      await obsServices.VirtualCamController.stop();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Automation endpoints
  context.web.registerRoute('GET', '/api/obs/automation', async function(req, res) {
    try {
      const rules = automationEngine.getRules();
      res.json({ success: true, rules: Array.from(rules.values()) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/automation', async function(req, res) {
    try {
      const rule = req.body;
      const ruleId = automationEngine.registerRule(rule);
      await saveRulesToStorage(context);
      res.json({ success: true, ruleId: ruleId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('DELETE', '/api/obs/automation/:id', async function(req, res) {
    try {
      const deleted = automationEngine.unregisterRule(req.params.id);
      if (deleted) {
        await saveRulesToStorage(context);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Rule not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scenes endpoints
  context.web.registerRoute('GET', '/api/obs/scenes', async function(req, res) {
    try {
      const sceneList = await obsServices.obsCore.call('GetSceneList');
      const currentScene = await obsServices.obsCore.call('GetCurrentProgramScene');
      res.json({
        scenes: sceneList.scenes || [],
        currentScene: currentScene.sceneName || ''
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/scenes', async function(req, res) {
    try {
      const { action, sceneName } = req.body;
      if (action === 'setCurrentScene') {
        await obsServices.obsCore.call('SetCurrentProgramScene', { sceneName });
        res.json({ success: true });
      } else if (action === 'createScene') {
        await obsServices.obsCore.call('CreateScene', { sceneName });
        res.json({ success: true });
      } else if (action === 'removeScene') {
        await obsServices.obsCore.call('RemoveScene', { sceneName });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sources endpoints
  context.web.registerRoute('GET', '/api/obs/sources', async function(req, res) {
    try {
      const sceneName = req.query.scene;
      if (!sceneName) {
        return res.status(400).json({ error: 'Scene name required' });
      }
      const itemList = await obsServices.obsCore.call('GetSceneItemList', { sceneName });
      res.json({ sources: itemList.sceneItems || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/sources', async function(req, res) {
    try {
      const { action, sceneName, sceneItemId, enabled, locked } = req.body;
      if (action === 'setVisibility') {
        await obsServices.obsCore.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: enabled });
        res.json({ success: true });
      } else if (action === 'setLocked') {
        await obsServices.obsCore.call('SetSceneItemLocked', { sceneName, sceneItemId, sceneItemLocked: locked });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audio endpoints
  context.web.registerRoute('GET', '/api/obs/audio', async function(req, res) {
    try {
      const inputList = await obsServices.obsCore.call('GetInputList');
      const audioSources = [];
      for (const input of inputList.inputs || []) {
        const volumeData = await obsServices.obsCore.call('GetInputVolume', { inputName: input.inputName });
        const muteData = await obsServices.obsCore.call('GetInputMute', { inputName: input.inputName });
        audioSources.push({
          name: input.inputName,
          volume: Math.round(Math.pow(10, volumeData.inputVolumeDb / 20) * 100),
          muted: muteData.inputMuted
        });
      }
      res.json({ audioSources });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/audio', async function(req, res) {
    try {
      const { action, inputName, volume, muted } = req.body;
      if (action === 'setVolume') {
        const volumeDb = 20 * Math.log10(volume / 100);
        await obsServices.obsCore.call('SetInputVolume', { inputName, inputVolumeDb: volumeDb });
        res.json({ success: true });
      } else if (action === 'toggleMute') {
        await obsServices.obsCore.call('ToggleInputMute', { inputName });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Controls endpoints
  context.web.registerRoute('GET', '/api/obs/controls', async function(req, res) {
    try {
      if (!obsServices || !obsServices.obsCore) {
        return res.status(503).json({ error: 'OBS services not initialized' });
      }
      
      // Default values in case calls fail
      let streamStatus = { outputActive: false, outputBytes: 0, outputDuration: 1 };
      let recordStatus = { outputActive: false };
      let virtualCamStatus = { outputActive: false };
      let replayStatus = { outputActive: false };
      let studioMode = { studioModeEnabled: false };
      let stats = {
        cpuUsage: 0,
        activeFps: 0,
        outputSkippedFrames: 0,
        averageFrameRenderTime: 0,
        renderTimePerFrame: 0
      };
      
      // Make calls with individual error handling
      try {
        streamStatus = await obsServices.obsCore.call('GetStreamStatus');
      } catch (e) {
        context.logger.error('GetStreamStatus failed:', e.message);
      }
      
      try {
        recordStatus = await obsServices.obsCore.call('GetRecordStatus');
      } catch (e) {
        context.logger.error('GetRecordStatus failed:', e.message);
      }
      
      try {
        virtualCamStatus = await obsServices.obsCore.call('GetVirtualCamStatus');
      } catch (e) {
        context.logger.error('GetVirtualCamStatus failed:', e.message);
      }
      
      try {
        replayStatus = await obsServices.obsCore.call('GetReplayBufferStatus');
      } catch (e) {
        context.logger.error('GetReplayBufferStatus failed:', e.message);
      }
      
      try {
        studioMode = await obsServices.obsCore.call('GetStudioModeEnabled');
      } catch (e) {
        context.logger.error('GetStudioModeEnabled failed:', e.message);
      }
      
      try {
        stats = await obsServices.obsCore.call('GetStats');
      } catch (e) {
        context.logger.error('GetStats failed:', e.message);
      }
      
      res.json({
        streaming: streamStatus.outputActive || false,
        recording: recordStatus.outputActive || false,
        virtualCam: virtualCamStatus.outputActive || false,
        replayBuffer: replayStatus.outputActive || false,
        studioMode: studioMode.studioModeEnabled || false,
        stats: {
          cpu: stats.cpuUsage || 0,
          fps: stats.activeFps || 0,
          dropped: stats.outputSkippedFrames || 0,
          kbps: streamStatus.outputBytes ? Math.round((streamStatus.outputBytes * 8) / streamStatus.outputDuration / 1000) : 0,
          renderTime: `${(stats.averageFrameRenderTime || 0).toFixed(1)} ms`,
          encodingTime: `${(stats.renderTimePerFrame || 0).toFixed(1)} ms`
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/controls', async function(req, res) {
    try {
      const { action } = req.body;
      if (action === 'toggleStreaming') {
        await obsServices.obsCore.call('ToggleStream');
      } else if (action === 'toggleRecording') {
        await obsServices.obsCore.call('ToggleRecord');
      } else if (action === 'toggleVirtualCam') {
        await obsServices.obsCore.call('ToggleVirtualCam');
      } else if (action === 'toggleReplayBuffer') {
        await obsServices.obsCore.call('ToggleReplayBuffer');
      } else if (action === 'saveReplay') {
        await obsServices.obsCore.call('SaveReplayBuffer');
      } else if (action === 'toggleStudioMode') {
        const current = await obsServices.obsCore.call('GetStudioModeEnabled');
        await obsServices.obsCore.call('SetStudioModeEnabled', { studioModeEnabled: !current.studioModeEnabled });
      } else if (action === 'triggerStudioTransition') {
        await obsServices.obsCore.call('TriggerStudioModeTransition');
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transitions endpoints
  context.web.registerRoute('GET', '/api/obs/transitions', async function(req, res) {
    try {
      const transitionsList = await obsServices.obsCore.call('GetSceneTransitionList');
      const currentTransition = await obsServices.obsCore.call('GetCurrentSceneTransition');
      res.json({
        transitions: transitionsList.transitions || [],
        currentTransition: currentTransition.transitionName || '',
        currentDuration: currentTransition.transitionDuration || 300
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/transitions', async function(req, res) {
    try {
      const { action, transitionName, duration } = req.body;
      if (action === 'setTransition') {
        await obsServices.obsCore.call('SetCurrentSceneTransition', { transitionName });
        res.json({ success: true });
      } else if (action === 'setDuration') {
        await obsServices.obsCore.call('SetCurrentSceneTransitionDuration', { transitionDuration: parseInt(duration) });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Filters endpoints
  context.web.registerRoute('GET', '/api/obs/filters', async function(req, res) {
    try {
      const sourceName = req.query.sourceName;
      if (!sourceName) {
        return res.status(400).json({ error: 'Source name required' });
      }
      const filterList = await obsServices.obsCore.call('GetSourceFilterList', { sourceName });
      res.json({ filters: filterList.filters || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/filters', async function(req, res) {
    try {
      const { action, sourceName, filterName, filterKind, filterSettings, enabled } = req.body;
      if (action === 'create') {
        await obsServices.obsCore.call('CreateSourceFilter', { sourceName, filterName, filterKind, filterSettings: filterSettings || {} });
        res.json({ success: true });
      } else if (action === 'remove') {
        await obsServices.obsCore.call('RemoveSourceFilter', { sourceName, filterName });
        res.json({ success: true });
      } else if (action === 'setEnabled') {
        await obsServices.obsCore.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled: enabled });
        res.json({ success: true });
      } else if (action === 'setSettings') {
        await obsServices.obsCore.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transforms endpoints
  context.web.registerRoute('GET', '/api/obs/transforms', async function(req, res) {
    try {
      const sceneName = req.query.sceneName;
      const sceneItemId = req.query.sceneItemId;
      if (!sceneName || !sceneItemId) {
        return res.status(400).json({ error: 'Scene name and item ID required' });
      }
      const transform = await obsServices.obsCore.call('GetSceneItemTransform', { sceneName, sceneItemId: parseInt(sceneItemId) });
      res.json({ transform: transform.sceneItemTransform || {} });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/transforms', async function(req, res) {
    try {
      const { sceneName, sceneItemId, transform } = req.body;
      await obsServices.obsCore.call('SetSceneItemTransform', { sceneName, sceneItemId: parseInt(sceneItemId), sceneItemTransform: transform });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Screenshots endpoints
  context.web.registerRoute('POST', '/api/obs/screenshots', async function(req, res) {
    try {
      const { action, sourceName, imageFilePath, imageFormat, imageWidth, imageHeight, imageCompressionQuality } = req.body;
      if (action === 'save') {
        const params = { sourceName, imageFormat: imageFormat || 'png', imageFilePath };
        if (imageWidth) params.imageWidth = parseInt(imageWidth);
        if (imageHeight) params.imageHeight = parseInt(imageHeight);
        if (imageCompressionQuality !== undefined) params.imageCompressionQuality = parseInt(imageCompressionQuality);
        await obsServices.obsCore.call('SaveSourceScreenshot', params);
        res.json({ success: true });
      } else if (action === 'get') {
        const params = { sourceName, imageFormat: imageFormat || 'png' };
        if (imageWidth) params.imageWidth = parseInt(imageWidth);
        if (imageHeight) params.imageHeight = parseInt(imageHeight);
        if (imageCompressionQuality !== undefined) params.imageCompressionQuality = parseInt(imageCompressionQuality);
        const screenshot = await obsServices.obsCore.call('GetSourceScreenshot', params);
        res.json({ success: true, imageData: screenshot.imageData || '' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Inputs endpoints
  context.web.registerRoute('GET', '/api/obs/inputs', async function(req, res) {
    try {
      const inputName = req.query.inputName;
      if (!inputName) {
        return res.status(400).json({ error: 'Input name required' });
      }
      const inputSettings = await obsServices.obsCore.call('GetInputSettings', { inputName });
      res.json({ settings: inputSettings.inputSettings || {}, kind: inputSettings.inputKind || '' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  context.web.registerRoute('POST', '/api/obs/inputs', async function(req, res) {
    try {
      const { action, sceneName, inputName, inputKind, inputSettings, newName } = req.body;
      if (action === 'create') {
        await obsServices.obsCore.call('CreateInput', { sceneName, inputName, inputKind, inputSettings: inputSettings || {}, sceneItemEnabled: true });
        res.json({ success: true });
      } else if (action === 'remove') {
        await obsServices.obsCore.call('RemoveInput', { inputName });
        res.json({ success: true });
      } else if (action === 'setSettings') {
        await obsServices.obsCore.call('SetInputSettings', { inputName, inputSettings });
        res.json({ success: true });
      } else if (action === 'rename') {
        await obsServices.obsCore.call('SetInputName', { inputName, newInputName: newName });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

/**
 * Register WebSocket handler for real-time updates
 */
function registerWebSocketHandler(context, obsServices, automationEngine) {
  // Track all connected clients
  const clients = new Set();
  
  // OBS event handlers - broadcast to all connected clients
  const obsEventHandlers = {
    // Scene events
    'CurrentProgramSceneChanged': (data) => {
      broadcastToClients({ type: 'CurrentProgramSceneChanged', data });
    },
    'SceneCreated': (data) => {
      broadcastToClients({ type: 'SceneCreated', data });
    },
    'SceneRemoved': (data) => {
      broadcastToClients({ type: 'SceneRemoved', data });
    },
    'SceneNameChanged': (data) => {
      broadcastToClients({ type: 'SceneNameChanged', data });
    },
    
    // Scene item events
    'SceneItemCreated': (data) => {
      broadcastToClients({ type: 'SceneItemCreated', data });
    },
    'SceneItemRemoved': (data) => {
      broadcastToClients({ type: 'SceneItemRemoved', data });
    },
    'SceneItemEnableStateChanged': (data) => {
      broadcastToClients({ type: 'SceneItemEnableStateChanged', data });
    },
    'SceneItemTransformChanged': (data) => {
      broadcastToClients({ type: 'SceneItemTransformChanged', data });
    },
    
    // Input/Source events
    'InputCreated': (data) => {
      broadcastToClients({ type: 'InputCreated', data });
    },
    'InputRemoved': (data) => {
      broadcastToClients({ type: 'InputRemoved', data });
    },
    'InputNameChanged': (data) => {
      broadcastToClients({ type: 'InputNameChanged', data });
    },
    'InputVolumeChanged': (data) => {
      broadcastToClients({ type: 'InputVolumeChanged', data });
    },
    'InputMuteStateChanged': (data) => {
      broadcastToClients({ type: 'InputMuteStateChanged', data });
    },
    'InputAudioSyncOffsetChanged': (data) => {
      broadcastToClients({ type: 'InputAudioSyncOffsetChanged', data });
    },
    'InputAudioTracksChanged': (data) => {
      broadcastToClients({ type: 'InputAudioTracksChanged', data });
    },
    'InputAudioMonitorTypeChanged': (data) => {
      broadcastToClients({ type: 'InputAudioMonitorTypeChanged', data });
    },
    
    // Stream/record events
    'StreamStateChanged': (data) => {
      broadcastToClients({ type: 'StreamStateChanged', data });
    },
    'RecordStateChanged': (data) => {
      broadcastToClients({ type: 'RecordStateChanged', data });
    },
    'ReplayBufferStateChanged': (data) => {
      broadcastToClients({ type: 'ReplayBufferStateChanged', data });
    },
    'VirtualcamStateChanged': (data) => {
      broadcastToClients({ type: 'VirtualcamStateChanged', data });
    },
    
    // Transition events
    'CurrentSceneTransitionChanged': (data) => {
      broadcastToClients({ type: 'CurrentSceneTransitionChanged', data });
    },
    'CurrentSceneTransitionDurationChanged': (data) => {
      broadcastToClients({ type: 'CurrentSceneTransitionDurationChanged', data });
    },
    
    // Profile/collection events
    'CurrentProfileChanged': (data) => {
      broadcastToClients({ type: 'CurrentProfileChanged', data });
    },
    'CurrentSceneCollectionChanged': (data) => {
      broadcastToClients({ type: 'CurrentSceneCollectionChanged', data });
    }
  };
  
  // Broadcast message to all connected clients
  function broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(messageStr);
        } catch (error) {
          context.logger.error('Error broadcasting to client', { error: error.message });
        }
      }
    });
  }
  
  // Subscribe to OBS events if obsCore supports it
  if (obsServices.obsCore && obsServices.obsCore.on) {
    Object.keys(obsEventHandlers).forEach(eventName => {
      obsServices.obsCore.on(eventName, obsEventHandlers[eventName]);
    });
    context.logger.info('Subscribed to OBS events for WebSocket broadcasting');
  } else if (obsServices.obsCore && obsServices.obsCore.addListener) {
    // Alternative event listener API
    Object.keys(obsEventHandlers).forEach(eventName => {
      obsServices.obsCore.addListener(eventName, obsEventHandlers[eventName]);
    });
    context.logger.info('Subscribed to OBS events for WebSocket broadcasting (via addListener)');
  } else {
    context.logger.warn('OBS Core does not support event subscription - real-time updates disabled');
  }
  
  // Register WebSocket handler
  context.web.registerWebSocket(function(ws, req) {
    context.logger.info('WebSocket client connected');
    clients.add(ws);

    // Send initial status
    obsServices.getStatus().then(function(status) {
      ws.send(JSON.stringify({ type: 'ServerStatus', data: status }));
    }).catch(function(error) {
      context.logger.error('Error getting status for WebSocket', { error: error.message });
    });

    // Handle incoming messages
    ws.on('message', async function(data) {
      try {
        const message = JSON.parse(data.toString());
        context.logger.debug('WebSocket message received', { type: message.type });

        // Handle different message types
        switch (message.type) {
          case 'getServerStatus':
            const status = await obsServices.getStatus();
            ws.send(JSON.stringify({ type: 'ServerStatus', data: status }));
            break;

          case 'SetCurrentProfile':
            if (obsServices.ProfileController) {
              await obsServices.ProfileController.setProfile(message.data.profileName);
              ws.send(JSON.stringify({ type: 'Success', message: 'Profile switched' }));
            }
            break;

          case 'SetCurrentCollection':
            if (obsServices.SceneCollectionController) {
              await obsServices.SceneCollectionController.setCollection(message.data.collectionName);
              ws.send(JSON.stringify({ type: 'Success', message: 'Collection switched' }));
            }
            break;

          case 'StartReplayBuffer':
            if (obsServices.ReplayBufferController) {
              await obsServices.ReplayBufferController.start();
              ws.send(JSON.stringify({ type: 'Success', message: 'Replay buffer started' }));
            }
            break;

          case 'StopReplayBuffer':
            if (obsServices.ReplayBufferController) {
              await obsServices.ReplayBufferController.stop();
              ws.send(JSON.stringify({ type: 'Success', message: 'Replay buffer stopped' }));
            }
            break;

          case 'SaveReplayBuffer':
            if (obsServices.ReplayBufferController) {
              await obsServices.ReplayBufferController.save();
              ws.send(JSON.stringify({ type: 'Success', message: 'Replay buffer saved' }));
            }
            break;

          case 'StartVirtualCamera':
            if (obsServices.VirtualCamController) {
              await obsServices.VirtualCamController.start();
              ws.send(JSON.stringify({ type: 'Success', message: 'Virtual camera started' }));
            }
            break;

          case 'StopVirtualCamera':
            if (obsServices.VirtualCamController) {
              await obsServices.VirtualCamController.stop();
              ws.send(JSON.stringify({ type: 'Success', message: 'Virtual camera stopped' }));
            }
            break;

          default:
            ws.send(JSON.stringify({ type: 'Error', errorMessage: 'Unknown message type: ' + message.type }));
        }
      } catch (error) {
        context.logger.error('WebSocket message handling error', { error: error.message });
        ws.send(JSON.stringify({ type: 'Error', errorMessage: 'Failed to process message' }));
      }
    });

    ws.on('close', function() {
      context.logger.info('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', function(error) {
      context.logger.error('WebSocket error', { error: error.message });
      clients.delete(ws);
    });
  });
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
    },
    enableUI: {
      type: 'boolean',
      label: 'Enable Control Panel UI',
      description: 'Start the web-based control panel interface',
      default: true
    },
    uiPort: {
      type: 'number',
      label: 'UI Server Port',
      description: 'Port for the web control panel',
      default: 5174,
      minimum: 1024,
      maximum: 65535
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
      // Get OBS WebSocket API from bot context (v2.0.212+)
      // context.obs provides: call(request, params), isConnected()
      const obsAPI = context.obs || null;
      
      if (obsAPI) {
        context.logger.info('Using bot OBS WebSocket API', {
          connected: obsAPI.isConnected()
        });
      } else {
        context.logger.warn('No OBS API available - module will not function');
      }

      // Initialize OBS services wrapper with direct API access
      obsServices = new OBSModuleCore({
        host: context.config.host || 'localhost',
        port: context.config.port || 4455,
        password: context.config.password || '',
        autoReconnect: context.config.autoReconnect !== false,
        reconnectDelay: context.config.reconnectDelay || 5000,
        logger: context.logger
      }, context.logger, obsAPI);
      
      await obsServices.connect();

      // Add controller methods to obsServices for UI API endpoints
      // These wrap the Phase 4 controller functionality
      obsServices.ProfileController = {
        listProfiles: async () => {
          if (!obsServices.obsCore?.call) return { profiles: [], currentProfile: null };
          try {
            const response = await obsServices.obsCore.call('GetProfileList');
            return {
              success: true,
              profiles: response.profiles || [],
              currentProfile: response.currentProfileName
            };
          } catch (error) {
            context.logger.error('Error listing profiles', { error: error.message });
            return { profiles: [], currentProfile: null };
          }
        },
        getCurrentProfile: async () => {
          if (!obsServices.obsCore?.call) return null;
          try {
            const response = await obsServices.obsCore.call('GetProfileList');
            return response.currentProfileName;
          } catch (error) {
            return null;
          }
        },
        setProfile: async (profileName) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('SetCurrentProfile', { profileName });
          return { success: true, profileName };
        },
        createProfile: async (profileName) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('CreateProfile', { profileName });
          return { success: true, profileName };
        },
        removeProfile: async (profileName) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('RemoveProfile', { profileName });
          return { success: true, profileName };
        }
      };

      obsServices.SceneCollectionController = {
        listCollections: async () => {
          if (!obsServices.obsCore?.call) return { collections: [], currentCollection: null };
          try {
            const response = await obsServices.obsCore.call('GetSceneCollectionList');
            return {
              success: true,
              collections: response.sceneCollections || [],
              currentCollection: response.currentSceneCollectionName
            };
          } catch (error) {
            return { collections: [], currentCollection: null };
          }
        },
        setCollection: async (collectionName) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('SetCurrentSceneCollection', { sceneCollectionName: collectionName });
          return { success: true, collectionName };
        },
        createCollection: async (collectionName) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('CreateSceneCollection', { sceneCollectionName: collectionName });
          return { success: true, collectionName };
        }
      };

      obsServices.VideoSettingsController = {
        getVideoSettings: async () => {
          if (!obsServices.obsCore?.call) return null;
          try {
            const response = await obsServices.obsCore.call('GetVideoSettings');
            return response;
          } catch (error) {
            return null;
          }
        },
        setVideoSettings: async (settings) => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('SetVideoSettings', settings);
          return { success: true };
        }
      };

      obsServices.ReplayBufferController = {
        getStatus: async () => {
          if (!obsServices.obsCore?.call) return { active: false };
          try {
            const response = await obsServices.obsCore.call('GetReplayBufferStatus');
            return { active: response.outputActive };
          } catch (error) {
            return { active: false };
          }
        },
        start: async () => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('StartReplayBuffer');
          return { success: true };
        },
        stop: async () => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('StopReplayBuffer');
          return { success: true };
        },
        save: async () => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('SaveReplayBuffer');
          return { success: true };
        }
      };

      obsServices.VirtualCamController = {
        getStatus: async () => {
          if (!obsServices.obsCore?.call) return { active: false };
          try {
            const response = await obsServices.obsCore.call('GetVirtualCamStatus');
            return { active: response.outputActive };
          } catch (error) {
            return { active: false };
          }
        },
        start: async () => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('StartVirtualCam');
          return { success: true };
        },
        stop: async () => {
          if (!obsServices.obsCore?.call) throw new Error('OBS not connected');
          await obsServices.obsCore.call('StopVirtualCam');
          return { success: true };
        }
      };

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

      // Load saved automation rules from storage
      await loadSavedRules(context);

      // Setup event-driven automation examples
      setupDefaultAutomations(context);

      // Store API in context for other modules
      context.obsApi = getPublicAPI(context);

      // Register web UI if context.web API is available
      if (context.web) {
        try {
          context.logger.info('Registering OBS Control web UI');

          // Register API endpoints FIRST (before static middleware that might catch-all)
          registerAPIRoutes(context, obsServices, automationEngine);

          // Serve static UI files from build directory at /ui
          // Core v2.0.214: Routes to /modules/:moduleId/ui/ to distinguish from admin config
          context.web.serveStatic('/ui', './build', {
            moduleContext: {
              obs: obsServices,
              context: context
            }
          });

          // Register WebSocket handler for real-time updates
          if (context.web.registerWebSocket) {
            registerWebSocketHandler(context, obsServices, automationEngine);
          }

          context.logger.info(`OBS Control UI available at ${context.web.getBaseUrl()}/ui`);
        } catch (uiError) {
          context.logger.error('Failed to register web UI', { error: uiError.message });
          // Don't throw - UI is optional, backend should still work
        }
      }

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
  },

  /**
   * Test alert method - trigger a test alert
   */
  testAlert: async function(type) {
    if (!moduleContext) {
      return { error: 'Module not initialized' };
    }
    return await testAlert(moduleContext, type);
  },

  /**
   * Create and save an automation rule
   */
  createAutomation: async function(rule) {
    if (!moduleContext || !automationEngine) {
      return { error: 'Module not initialized' };
    }
    
    try {
      const ruleId = automationEngine.registerRule(rule);
      await saveRulesToStorage(moduleContext);
      
      return {
        success: true,
        ruleId: ruleId,
        message: 'Automation rule created successfully'
      };
    } catch (error) {
      moduleContext.logger.error('Failed to create automation', {
        error: error.message
      });
      return { error: error.message };
    }
  },

  /**
   * Delete an automation rule
   */
  deleteAutomation: async function(ruleId) {
    if (!moduleContext || !automationEngine) {
      return { error: 'Module not initialized' };
    }
    
    const deleted = automationEngine.unregisterRule(ruleId);
    if (deleted) {
      await saveRulesToStorage(moduleContext);
      return {
        success: true,
        message: 'Automation rule deleted successfully'
      };
    }
    
    return { error: 'Rule not found' };
  },

  /**
   * List all automation rules
   */
  listAutomations: function() {
    if (!moduleContext || !automationEngine) {
      return { error: 'Module not initialized' };
    }
    
    return {
      success: true,
      rules: automationEngine.getRules()
    };
  },

  /**
   * Get alert queue status
   */
  getAlertStatus: function() {
    if (!moduleContext || !alertEngine) {
      return { error: 'Module not initialized' };
    }
    
    return {
      success: true,
      status: alertEngine.getQueueStatus()
    };
  }
};
