/**
 * Alert System v3.0 - Production Module
 * 
 * Next-generation alert system for stream events using unified overlay architecture.
 * Supports all media types, template management, and complete visual customization.
 * 
 * Architecture:
 * - Uses context.overlay.show() for rendering (unified overlay system)
 * - Exposes context.registerApi('alerts', {...}) for module interoperability
 * - Database-backed templates, queue, history, sounds
 * - SvelteKit admin UI with 4 tabs
 * - Local media storage with HTTP serving
 */

// ============================================================================
// Alert Queue Manager
// ============================================================================

class AlertQueue {
  constructor(logger, storage) {
    this.logger = logger;
    this.storage = storage;
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 1;
    this.minDelay = 500;
    this.paused = false;
  }

  async add(alert) {
    const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const queueItem = {
      id: alertId,
      ...alert,
      priority: alert.priority || 5,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.queue.push(queueItem);
    this.queue.sort((a, b) => a.priority - b.priority);

    this.logger.info('Alert added to queue', {
      alertId,
      type: alert.type,
      queueLength: this.queue.length,
      priority: queueItem.priority
    });

    // Store in database
    await this.storage.set(`queue:${alertId}`, JSON.stringify(queueItem));

    // Start processing if not already
    if (!this.processing && !this.paused) {
      this.processQueue();
    }

    return alertId;
  }

  async processQueue() {
    if (this.processing || this.paused || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && !this.paused) {
      const alert = this.queue.shift();
      
      try {
        alert.status = 'processing';
        await this.storage.set(`queue:${alert.id}`, JSON.stringify(alert));

        this.logger.info('Processing alert', {
          alertId: alert.id,
          type: alert.type
        });

        // Alert will be displayed by the caller
        if (alert.onProcess) {
          await alert.onProcess(alert);
        }

        alert.status = 'completed';
        alert.processedAt = new Date().toISOString();
        
        // Move to history
        await this.storage.set(`history:${alert.id}`, JSON.stringify(alert));
        await this.storage.delete(`queue:${alert.id}`);

        // Delay before next alert
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.minDelay));
        }

      } catch (error) {
        this.logger.error('Failed to process alert', {
          alertId: alert.id,
          error: error.message
        });
        
        alert.status = 'failed';
        alert.error = error.message;
        await this.storage.set(`queue:${alert.id}`, JSON.stringify(alert));
      }
    }

    this.processing = false;
  }

  clear() {
    const count = this.queue.length;
    this.queue = [];
    this.logger.info('Queue cleared', { alertsRemoved: count });
    return count;
  }

  pause() {
    this.paused = true;
    this.logger.info('Queue paused');
  }

  resume() {
    this.paused = false;
    this.logger.info('Queue resumed');
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  getQueue() {
    return this.queue.map(item => ({
      id: item.id,
      type: item.type,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt
    }));
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      paused: this.paused
    };
  }
}

// ============================================================================
// Template Manager
// ============================================================================

class TemplateManager {
  constructor(logger, storage) {
    this.logger = logger;
    this.storage = storage;
    this.templates = new Map();
  }

  async initialize() {
    // Load templates from storage
    const keys = await this.storage.keys();
    const templateKeys = keys.filter(k => k.startsWith('template:'));

    for (const key of templateKeys) {
      const data = await this.storage.get(key);
      if (data) {
        try {
          const template = JSON.parse(data);
          this.templates.set(template.id, template);
        } catch (error) {
          this.logger.error('Failed to parse template', { key, error: error.message });
        }
      }
    }

    // Create default templates if none exist
    if (this.templates.size === 0) {
      await this.createDefaultTemplates();
    }

    this.logger.info('Template manager initialized', {
      templateCount: this.templates.size
    });
  }

  async createDefaultTemplates() {
    const defaults = [
      {
        id: 'default-follow',
        name: 'Default Follow Alert',
        eventType: 'follow',
        enabled: true,
        templateType: 'html',
        htmlContent: `
          <div class="alert-container follow-alert">
            <div class="alert-icon">👤</div>
            <div class="alert-content">
              <div class="alert-title">New Follower!</div>
              <div class="alert-username">{{displayName}}</div>
            </div>
          </div>
        `,
        cssContent: `
          .alert-container { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 20px;
            animation: slideIn 0.5s ease-out;
          }
          .alert-icon { font-size: 48px; }
          .alert-title { font-size: 24px; font-weight: bold; color: white; }
          .alert-username { font-size: 32px; font-weight: bold; color: #fff; }
          @keyframes slideIn {
            from { transform: translateY(-100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `,
        duration: 5000,
        animation: 'slide-in',
        soundFile: null,
        soundVolume: 0.8
      },
      {
        id: 'default-subscribe',
        name: 'Default Subscribe Alert',
        eventType: 'subscribe',
        enabled: true,
        templateType: 'html',
        htmlContent: `
          <div class="alert-container subscribe-alert">
            <div class="alert-icon">⭐</div>
            <div class="alert-content">
              <div class="alert-title">New Subscriber!</div>
              <div class="alert-username">{{displayName}}</div>
              <div class="alert-tier">Tier {{tier}}</div>
            </div>
          </div>
        `,
        cssContent: `
          .alert-container { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 20px;
            animation: bounce 0.6s ease-out;
          }
          .alert-icon { font-size: 48px; }
          .alert-title { font-size: 24px; font-weight: bold; color: white; }
          .alert-username { font-size: 32px; font-weight: bold; color: #fff; }
          .alert-tier { font-size: 20px; color: #ffe; }
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `,
        duration: 5000,
        animation: 'bounce',
        soundFile: null,
        soundVolume: 0.8
      },
      {
        id: 'default-raid',
        name: 'Default Raid Alert',
        eventType: 'raid',
        enabled: true,
        templateType: 'html',
        htmlContent: `
          <div class="alert-container raid-alert">
            <div class="alert-icon">🎯</div>
            <div class="alert-content">
              <div class="alert-title">RAID!</div>
              <div class="alert-username">{{displayName}}</div>
              <div class="alert-viewers">{{viewers}} viewers</div>
            </div>
          </div>
        `,
        cssContent: `
          .alert-container { 
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 20px;
            animation: zoom 0.5s ease-out;
          }
          .alert-icon { font-size: 48px; }
          .alert-title { font-size: 28px; font-weight: bold; color: white; }
          .alert-username { font-size: 32px; font-weight: bold; color: #fff; }
          .alert-viewers { font-size: 20px; color: #ffe; }
          @keyframes zoom {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `,
        duration: 6000,
        animation: 'zoom',
        soundFile: null,
        soundVolume: 0.8
      },
      {
        id: 'default-donation',
        name: 'Default Donation Alert',
        eventType: 'donation',
        enabled: true,
        templateType: 'html',
        htmlContent: `
          <div class="alert-container donation-alert">
            <div class="alert-icon">💰</div>
            <div class="alert-content">
              <div class="alert-title">Donation!</div>
              <div class="alert-username">{{displayName}}</div>
              <div class="alert-amount">{{currency}} {{amount}}</div>
            </div>
          </div>
        `,
        cssContent: `
          .alert-container { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 20px;
            animation: fadeIn 0.5s ease-out;
          }
          .alert-icon { font-size: 48px; }
          .alert-title { font-size: 24px; font-weight: bold; color: white; }
          .alert-username { font-size: 32px; font-weight: bold; color: #fff; }
          .alert-amount { font-size: 28px; font-weight: bold; color: #ffe; }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `,
        duration: 5000,
        animation: 'fade',
        soundFile: null,
        soundVolume: 0.8
      },
      {
        id: 'default-cheer',
        name: 'Default Cheer Alert',
        eventType: 'cheer',
        enabled: true,
        templateType: 'html',
        htmlContent: `
          <div class="alert-container cheer-alert">
            <div class="alert-icon">🎉</div>
            <div class="alert-content">
              <div class="alert-title">Bits!</div>
              <div class="alert-username">{{displayName}}</div>
              <div class="alert-amount">{{amount}} bits</div>
            </div>
          </div>
        `,
        cssContent: `
          .alert-container { 
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 20px;
            animation: confetti 0.6s ease-out;
          }
          .alert-icon { font-size: 48px; }
          .alert-title { font-size: 24px; font-weight: bold; color: #333; }
          .alert-username { font-size: 32px; font-weight: bold; color: #333; }
          .alert-amount { font-size: 24px; color: #666; }
          @keyframes confetti {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
        `,
        duration: 5000,
        animation: 'confetti',
        soundFile: null,
        soundVolume: 0.8
      }
    ];

    for (const template of defaults) {
      await this.createTemplate(template);
    }

    this.logger.info('Default templates created', { count: defaults.length });
  }

  async createTemplate(template) {
    const templateId = template.id || 'template_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const fullTemplate = {
      id: templateId,
      name: template.name,
      eventType: template.eventType,
      enabled: template.enabled !== false,
      templateType: template.templateType || 'html',
      htmlContent: template.htmlContent || '',
      cssContent: template.cssContent || '',
      jsContent: template.jsContent || '',
      mediaType: template.mediaType || null,
      mediaUrl: template.mediaUrl || null,
      mediaSettings: template.mediaSettings || {},
      duration: template.duration || 5000,
      animation: template.animation || 'slide-in',
      soundFile: template.soundFile || null,
      soundVolume: template.soundVolume || 0.8,
      ttsEnabled: template.ttsEnabled || false,
      ttsVoice: template.ttsVoice || 'en-US',
      ttsSpeed: template.ttsSpeed || 1.0,
      ttsTemplate: template.ttsTemplate || '',
      minAmount: template.minAmount || null,
      minViewers: template.minViewers || null,
      vipOnly: template.vipOnly || false,
      subOnly: template.subOnly || false,
      firstTimeOnly: template.firstTimeOnly || false,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: template.usageCount || 0
    };

    this.templates.set(templateId, fullTemplate);
    await this.storage.set(`template:${templateId}`, JSON.stringify(fullTemplate));

    this.logger.info('Template created', {
      templateId,
      name: template.name,
      eventType: template.eventType
    });

    return fullTemplate;
  }

  async updateTemplate(templateId, updates) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updated = {
      ...template,
      ...updates,
      id: templateId,
      updatedAt: new Date().toISOString()
    };

    this.templates.set(templateId, updated);
    await this.storage.set(`template:${templateId}`, JSON.stringify(updated));

    this.logger.info('Template updated', { templateId });
    return updated;
  }

  async deleteTemplate(templateId) {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.templates.delete(templateId);
    await this.storage.delete(`template:${templateId}`);

    this.logger.info('Template deleted', { templateId });
  }

  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  getTemplates(filter = {}) {
    let templates = Array.from(this.templates.values());

    if (filter.eventType) {
      templates = templates.filter(t => t.eventType === filter.eventType);
    }

    if (filter.enabled !== undefined) {
      templates = templates.filter(t => t.enabled === filter.enabled);
    }

    return templates;
  }

  async incrementUsage(templateId) {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      await this.storage.set(`template:${templateId}`, JSON.stringify(template));
    }
  }

  renderTemplate(template, data) {
    let html = template.htmlContent;
    let css = template.cssContent;

    // Replace template variables
    const variables = {
      username: data.username || '',
      displayName: data.displayName || data.username || '',
      amount: data.amount || '',
      message: data.message || '',
      tier: data.tier || 1,
      months: data.months || 1,
      viewers: data.viewers || 0,
      currency: data.currency || 'USD'
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      css = css.replace(regex, value);
    }

    return {
      html,
      css,
      duration: template.duration,
      animation: template.animation,
      sound: template.soundFile,
      soundVolume: template.soundVolume
    };
  }
}

// ============================================================================
// Alert System Module
// ============================================================================

let moduleContext = null;
let alertQueue = null;
let templateManager = null;

async function showAlert(config) {
  if (!moduleContext) {
    return { success: false, error: 'Module not initialized' };
  }

  try {
    // Get template
    let template = null;
    if (config.templateId) {
      template = templateManager.getTemplate(config.templateId);
    } else {
      // Find default template for event type
      const templates = templateManager.getTemplates({
        eventType: config.type,
        enabled: true
      });
      template = templates[0];
    }

    if (!template) {
      return {
        success: false,
        error: `No template found for type: ${config.type}`
      };
    }

    // Check conditions
    if (template.minAmount && config.data.amount < template.minAmount) {
      return {
        success: false,
        error: 'Amount below minimum threshold',
        skipped: true
      };
    }

    if (template.minViewers && config.data.viewers < template.minViewers) {
      return {
        success: false,
        error: 'Viewers below minimum threshold',
        skipped: true
      };
    }

    // Render template
    const rendered = templateManager.renderTemplate(template, config.data);

    // Add to queue
    const alertId = await alertQueue.add({
      type: config.type,
      templateId: template.id,
      data: config.data,
      duration: config.duration || rendered.duration,
      onProcess: async (alert) => {
        // Display alert via unified overlay
        if (moduleContext.overlay) {
          await moduleContext.overlay.show({
            component: 'CustomHTML',
            layer: 100,
            data: {
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { 
                      margin: 0; 
                      padding: 0; 
                      overflow: hidden;
                      background: transparent;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                      width: 100vw;
                    }
                    ${rendered.css}
                  </style>
                </head>
                <body>
                  ${rendered.html}
                </body>
                </html>
              `,
              duration: rendered.duration
            },
            duration: rendered.duration
          });

          // Play sound if specified
          if (rendered.sound && moduleContext.audio) {
            await moduleContext.audio.play({
              file: rendered.sound,
              volume: rendered.soundVolume
            });
          }
        }

        // Increment template usage
        await templateManager.incrementUsage(template.id);

        // Save to history
        const historyEntry = {
          id: alert.id,
          templateId: template.id,
          eventType: config.type,
          eventData: config.data,
          displayedAt: new Date().toISOString(),
          duration: rendered.duration
        };
        await moduleContext.storage.set(`history:${alert.id}`, JSON.stringify(historyEntry));
      }
    });

    return {
      success: true,
      alertId,
      message: `Alert queued: ${config.type}`
    };

  } catch (error) {
    moduleContext.logger.error('Failed to show alert', {
      type: config.type,
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

async function testAlert(type) {
  const testData = {
    follow: {
      type: 'follow',
      data: {
        username: 'TestFollower',
        displayName: 'TestFollower'
      }
    },
    subscribe: {
      type: 'subscribe',
      data: {
        username: 'TestSubscriber',
        displayName: 'TestSubscriber',
        tier: 1,
        months: 1
      }
    },
    raid: {
      type: 'raid',
      data: {
        username: 'TestRaider',
        displayName: 'TestRaider',
        viewers: 50
      }
    },
    donation: {
      type: 'donation',
      data: {
        username: 'TestDonor',
        displayName: 'TestDonor',
        amount: 5.00,
        currency: 'USD',
        message: 'Great stream!'
      }
    },
    cheer: {
      type: 'cheer',
      data: {
        username: 'TestCheerer',
        displayName: 'TestCheerer',
        amount: 100,
        message: 'Love the content!'
      }
    }
  };

  const config = testData[type] || testData.follow;
  return await showAlert(config);
}

function subscribeToEvents(context, config) {
  // Follow events
  if (config.enableFollowAlerts !== false) {
    context.on('follow', async (event) => {
      await showAlert({
        type: 'follow',
        data: {
          username: event.data.username,
          displayName: event.data.displayName || event.data.username
        }
      });
    });
  }

  // Subscribe events
  if (config.enableSubscribeAlerts !== false) {
    context.on('subscribe', async (event) => {
      await showAlert({
        type: 'subscribe',
        data: {
          username: event.data.username,
          displayName: event.data.displayName || event.data.username,
          tier: event.data.tier || 1,
          months: event.data.months || 1
        }
      });
    });
  }

  // Raid events
  if (config.enableRaidAlerts !== false) {
    context.on('raid', async (event) => {
      const viewers = event.data.viewerCount || event.data.viewers || 0;
      
      if (viewers >= (config.minRaidViewers || 0)) {
        await showAlert({
          type: 'raid',
          data: {
            username: event.data.username,
            displayName: event.data.displayName || event.data.username,
            viewers
          }
        });
      }
    });
  }

  // Donation events
  if (config.enableDonationAlerts !== false) {
    context.on('donation', async (event) => {
      const amount = event.data.amount || 0;
      
      if (amount >= (config.minDonationAmount || 0)) {
        await showAlert({
          type: 'donation',
          data: {
            username: event.data.username,
            displayName: event.data.displayName || event.data.username,
            amount,
            currency: event.data.currency || 'USD',
            message: event.data.message || ''
          }
        });
      }
    });
  }

  // Cheer events
  if (config.enableCheerAlerts !== false) {
    context.on('cheer', async (event) => {
      const amount = event.data.bits || event.data.amount || 0;
      
      if (amount >= (config.minCheerBits || 0)) {
        await showAlert({
          type: 'cheer',
          data: {
            username: event.data.username,
            displayName: event.data.displayName || event.data.username,
            amount,
            message: event.data.message || ''
          }
        });
      }
    });
  }
}

// Export module
module.exports = {
  name: 'Alert System',
  version: '3.0.0',

  async initialize(context) {
    moduleContext = context;

    // Initialize queue and template manager
    alertQueue = new AlertQueue(context.logger, context.storage);
    templateManager = new TemplateManager(context.logger, context.storage);
    
    await templateManager.initialize();

    // Get configuration
    const config = await context.getConfig();

    // Subscribe to events
    subscribeToEvents(context, config);

    // Register module API for other modules
    context.registerApi('alerts', {
      showAlert: showAlert,
      clearQueue: () => alertQueue.clear(),
      getQueue: () => alertQueue.getQueue(),
      getQueueStatus: () => alertQueue.getStatus(),
      pauseQueue: () => alertQueue.pause(),
      resumeQueue: () => alertQueue.resume(),
      testAlert: testAlert,
      getTemplates: (filter) => templateManager.getTemplates(filter),
      getTemplate: (id) => templateManager.getTemplate(id),
      createTemplate: (template) => templateManager.createTemplate(template),
      updateTemplate: (id, updates) => templateManager.updateTemplate(id, updates),
      deleteTemplate: (id) => templateManager.deleteTemplate(id)
    });

    // Serve media files
    if (context.web) {
      context.web.serveStatic('/media', './media');
    }

    context.logger.info('Alert System v3.0 initialized', {
      templates: templateManager.templates.size,
      hasOverlay: !!context.overlay,
      hasWeb: !!context.web
    });
  },

  async shutdown(context) {
    if (alertQueue) {
      alertQueue.clear();
    }
    
    context.logger.info('Alert System v3.0 shutdown');
    moduleContext = null;
    alertQueue = null;
    templateManager = null;
  }
};
