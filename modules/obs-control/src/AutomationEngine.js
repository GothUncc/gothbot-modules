/**
 * Automation Engine
 * Event-driven automation system for OBS actions
 */

export class AutomationEngine {
  constructor(obsCore, context) {
    this.obsCore = obsCore;
    this.context = context;
    this.rules = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Register automation rule
   * @param {Object} rule - Automation rule configuration
   * @returns {string} Rule ID
   */
  registerRule(rule) {
    const ruleId = rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate rule
    if (!rule.eventType) {
      throw new Error('Rule must have an eventType');
    }
    if (!rule.actions || !Array.isArray(rule.actions)) {
      throw new Error('Rule must have actions array');
    }

    // Store rule
    this.rules.set(ruleId, {
      ...rule,
      id: ruleId,
      enabled: rule.enabled !== false,
      createdAt: Date.now()
    });

    // Create event handler
    const handler = async (event) => {
      await this.executeRule(ruleId, event);
    };

    // Subscribe to event
    this.context.on(rule.eventType, handler);
    this.eventHandlers.set(ruleId, { eventType: rule.eventType, handler });

    this.context.logger.info('Automation rule registered', {
      ruleId,
      eventType: rule.eventType,
      actionCount: rule.actions.length
    });

    return ruleId;
  }

  /**
   * Unregister automation rule
   * @param {string} ruleId - Rule ID to remove
   */
  unregisterRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      this.context.logger.warn('Rule not found for unregistration', { ruleId });
      return false;
    }

    // Remove event handler
    const handlerInfo = this.eventHandlers.get(ruleId);
    if (handlerInfo) {
      this.context.off(handlerInfo.eventType, handlerInfo.handler);
      this.eventHandlers.delete(ruleId);
    }

    // Remove rule
    this.rules.delete(ruleId);

    this.context.logger.info('Automation rule unregistered', { ruleId });
    return true;
  }

  /**
   * Execute automation rule
   * @param {string} ruleId - Rule ID to execute
   * @param {Object} event - Event that triggered the rule
   */
  async executeRule(ruleId, event) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return;
    }

    // Check if rule is enabled
    if (!rule.enabled) {
      return;
    }

    this.context.logger.debug('Evaluating automation rule', {
      ruleId,
      eventType: event.type,
      hasConditions: !!rule.conditions
    });

    // Check conditions
    if (rule.conditions && !this.evaluateConditions(rule.conditions, event)) {
      this.context.logger.debug('Rule conditions not met', { ruleId });
      return;
    }

    this.context.logger.info('Executing automation rule', {
      ruleId,
      actionCount: rule.actions.length
    });

    // Execute actions sequentially
    for (let i = 0; i < rule.actions.length; i++) {
      const action = rule.actions[i];
      
      try {
        await this.executeAction(action, event);
      } catch (error) {
        this.context.logger.error('Automation action failed', {
          ruleId,
          actionIndex: i,
          actionType: action.type,
          error: error.message,
          stack: error.stack
        });

        // Stop execution if action fails and stopOnError is true
        if (rule.stopOnError) {
          break;
        }
      }
    }
  }

  /**
   * Execute single action
   * @param {Object} action - Action configuration
   * @param {Object} event - Event context
   */
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
        const currentScene = await this.obsCore.getCurrentProgramScene();
        const visible = await this.obsCore.getSourceVisibility(currentScene, action.source);
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

      case 'flash_filter':
        // Apply color flash filter temporarily
        await this.executeFlashFilter(action);
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
        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
        break;

      case 'emit_event':
        // Emit custom event that other modules can listen to
        await this.context.emit(action.eventName, {
          ...action.data,
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
          type: action.type,
          availableTypes: [
            'switch_scene', 'show_source', 'hide_source', 'toggle_source',
            'play_media', 'pause_media', 'restart_media',
            'set_filter_enabled', 'flash_filter',
            'start_streaming', 'stop_streaming',
            'start_recording', 'stop_recording',
            'delay', 'emit_event', 'log'
          ]
        });
    }
  }

  /**
   * Execute flash filter effect
   */
  async executeFlashFilter(action) {
    // This is a complex effect that temporarily applies a color filter
    // Implementation depends on OBS filter API
    this.context.logger.debug('Flash filter effect', {
      source: action.source,
      color: action.color,
      duration: action.duration
    });

    // TODO: Implement actual flash filter
    // For now, just log
  }

  /**
   * Evaluate rule conditions
   * @param {Object} conditions - Conditions to evaluate
   * @param {Object} event - Event to evaluate against
   * @returns {boolean} True if conditions are met
   */
  evaluateConditions(conditions, event) {
    // Simple condition evaluation
    // Supports: field comparisons, min/max values, platform filtering

    // Platform filter
    if (conditions.platform) {
      const platforms = Array.isArray(conditions.platform) 
        ? conditions.platform 
        : [conditions.platform];
      
      if (!platforms.includes(event.platform)) {
        return false;
      }
    }

    // Minimum value checks
    if (conditions.minViewers !== undefined && event.viewers < conditions.minViewers) {
      return false;
    }
    if (conditions.minAmount !== undefined && event.amount < conditions.minAmount) {
      return false;
    }
    if (conditions.minBits !== undefined && event.bits < conditions.minBits) {
      return false;
    }

    // Maximum value checks
    if (conditions.maxViewers !== undefined && event.viewers > conditions.maxViewers) {
      return false;
    }
    if (conditions.maxAmount !== undefined && event.amount > conditions.maxAmount) {
      return false;
    }

    // User filter
    if (conditions.users) {
      const users = Array.isArray(conditions.users) ? conditions.users : [conditions.users];
      if (!users.includes(event.user?.username)) {
        return false;
      }
    }

    // Custom condition function (if provided as string, would need eval - not recommended)
    if (conditions.custom && typeof conditions.custom === 'function') {
      return conditions.custom(event);
    }

    return true;
  }

  /**
   * Get all registered rules
   */
  getRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get specific rule
   */
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    rule.enabled = enabled;
    this.context.logger.info('Rule enabled status changed', { ruleId, enabled });
    return true;
  }

  /**
   * Cleanup all rules and handlers
   */
  async cleanup() {
    this.context.logger.info('Cleaning up automation engine', {
      ruleCount: this.rules.size
    });

    // Unregister all rules
    const ruleIds = Array.from(this.rules.keys());
    for (const ruleId of ruleIds) {
      this.unregisterRule(ruleId);
    }

    this.rules.clear();
    this.eventHandlers.clear();

    this.context.logger.info('Automation engine cleanup complete');
  }
}
