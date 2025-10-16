/**
 * Alert System Module
 * 
 * Multi-platform stream alerts with custom animations, sounds, and TTS support.
 * Subscribes to platform events and displays beautiful overlay alerts.
 */

// Alert queue to prevent overlapping alerts
const alertQueue = [];
let isProcessingAlert = false;

// Store module context globally
let moduleContext = null;

/**
 * Subscribe to platform events based on configuration
 */
function subscribeToEvents(ctx, config) {
  // Follow events
  if (config.enableFollowAlerts) {
    ctx.on('follow', (event) => {
      queueAlert({
        type: 'follow',
        platform: event.platform,
        username: event.data.username,
        displayName: event.data.displayName || event.data.username,
        message: `${event.data.displayName || event.data.username} just followed!`,
        timestamp: Date.now()
      });
    });
  }
  
  // Subscribe events
  if (config.enableSubscribeAlerts) {
    ctx.on('subscribe', (event) => {
      const tier = event.data.tier || 1;
      const months = event.data.months || 1;
      let message = `${event.data.displayName || event.data.username} subscribed`;
      
      if (months > 1) {
        message += ` for ${months} months!`;
      } else {
        message += '!';
      }
      
      if (tier > 1) {
        message += ` (Tier ${tier})`;
      }
      
      queueAlert({
        type: 'subscribe',
        platform: event.platform,
        username: event.data.username,
        displayName: event.data.displayName || event.data.username,
        tier,
        months,
        message,
        timestamp: Date.now()
      });
    });
  }
  
  // Raid events
  if (config.enableRaidAlerts) {
    ctx.on('raid', (event) => {
      const viewers = event.data.viewerCount || 0;
      queueAlert({
        type: 'raid',
        platform: event.platform,
        username: event.data.username,
        displayName: event.data.displayName || event.data.username,
        viewers,
        message: `${event.data.displayName || event.data.username} is raiding with ${viewers} viewers!`,
        timestamp: Date.now()
      });
    });
  }
  
  // Donation events
  if (config.enableDonationAlerts) {
    ctx.on('donation', (event) => {
      const amount = event.data.amount || 0;
      
      // Check minimum amount
      if (amount >= config.minDonationAmount) {
        const currency = event.data.currency || 'USD';
        queueAlert({
          type: 'donation',
          platform: event.platform,
          username: event.data.username,
          displayName: event.data.displayName || event.data.username,
          amount,
          currency,
          message: `${event.data.displayName || event.data.username} donated ${currency} ${amount}!`,
          userMessage: event.data.message || '',
          timestamp: Date.now()
        });
      }
    });
  }
  
  // Cheer/Bits events
  if (config.enableCheerAlerts) {
    ctx.on('cheer', (event) => {
      const amount = event.data.bits || event.data.amount || 0;
      
      // Check minimum amount
      if (amount >= config.minCheerAmount) {
        queueAlert({
          type: 'cheer',
          platform: event.platform,
          username: event.data.username,
          displayName: event.data.displayName || event.data.username,
          amount,
          message: `${event.data.displayName || event.data.username} cheered ${amount} bits!`,
          userMessage: event.data.message || '',
          timestamp: Date.now()
        });
      }
    });
  }
}

/**
 * Add alert to queue
 */
function queueAlert(alert) {
  if (!moduleContext) return;
  
  moduleContext.logger.info('Alert queued', { alert });
  alertQueue.push(alert);
  
  // Store alert in module data for overlay to fetch
  storeAlert(alert);
}

/**
 * Store alert in database for persistence
 */
async function storeAlert(alert) {
  if (!moduleContext) return;
  
  try {
    // Get current alerts from storage
    const alertsData = await moduleContext.getData('alerts') || { list: [] };
    
    // Add new alert to list (keep last 100)
    alertsData.list.unshift(alert);
    if (alertsData.list.length > 100) {
      alertsData.list = alertsData.list.slice(0, 100);
    }
    
    // Store current alert for overlay to display
    alertsData.current = alert;
    alertsData.lastUpdate = Date.now();
    
    await moduleContext.setData('alerts', alertsData);
  } catch (error) {
    moduleContext.logger.error('Failed to store alert', { error: error.message });
  }
}

/**
 * Process alert queue (prevent overlapping alerts)
 */
async function processAlertQueue() {
  if (!moduleContext) return;
  
  if (isProcessingAlert || alertQueue.length === 0) {
    setTimeout(processAlertQueue, 500);
    return;
  }
  
  isProcessingAlert = true;
  const alert = alertQueue.shift();
  
  try {
    // Get config for alert duration
    const config = await moduleContext.getConfig();
    const duration = (config.alertDuration || 5) * 1000;
    
    // Mark alert as active
    await moduleContext.setData('currentAlert', alert);
    
    moduleContext.logger.info('Displaying alert', { alert });
    
    // Wait for alert duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Clear current alert
    await moduleContext.setData('currentAlert', null);
  } catch (error) {
    moduleContext.logger.error('Error processing alert', { error: error.message });
  } finally {
    isProcessingAlert = false;
    setTimeout(processAlertQueue, 500);
  }
}

/**
 * Test alert endpoint - for module developers to test alerts
 */
async function testAlert(ctx, type = 'follow') {
  const testAlerts = {
    follow: {
      type: 'follow',
      platform: 'twitch',
      username: 'testuser',
      displayName: 'TestUser',
      message: 'TestUser just followed!',
      timestamp: Date.now()
    },
    subscribe: {
      type: 'subscribe',
      platform: 'twitch',
      username: 'testuser',
      displayName: 'TestUser',
      tier: 1,
      months: 1,
      message: 'TestUser subscribed!',
      timestamp: Date.now()
    },
    raid: {
      type: 'raid',
      platform: 'twitch',
      username: 'testuser',
      displayName: 'TestUser',
      viewers: 42,
      message: 'TestUser is raiding with 42 viewers!',
      timestamp: Date.now()
    },
    donation: {
      type: 'donation',
      platform: 'streamlabs',
      username: 'testuser',
      displayName: 'TestUser',
      amount: 5.00,
      currency: 'USD',
      message: 'TestUser donated USD 5.00!',
      userMessage: 'Love the stream!',
      timestamp: Date.now()
    },
    cheer: {
      type: 'cheer',
      platform: 'twitch',
      username: 'testuser',
      displayName: 'TestUser',
      amount: 100,
      message: 'TestUser cheered 100 bits!',
      userMessage: 'Poggers!',
      timestamp: Date.now()
    }
  };
  
  const alert = testAlerts[type] || testAlerts.follow;
  queueAlert(alert);
  
  return {
    success: true,
    message: `Test ${type} alert queued`,
    alert
  };
}

// Export module instance using CommonJS format for isolated-vm compatibility
module.exports = {
  // Required metadata
  name: 'Alert System',
  version: '1.0.1',
  
  // Configuration schema
  configSchema: {
    type: 'object',
    properties: {
      enableFollowAlerts: {
        type: 'boolean',
        title: 'Enable Follow Alerts',
        description: 'Show alerts when someone follows',
        default: true
      },
      enableSubscribeAlerts: {
        type: 'boolean',
        title: 'Enable Subscribe Alerts',
        description: 'Show alerts for subscriptions',
        default: true
      },
      enableRaidAlerts: {
        type: 'boolean',
        title: 'Enable Raid Alerts',
        description: 'Show alerts for incoming raids',
        default: true
      },
      enableDonationAlerts: {
        type: 'boolean',
        title: 'Enable Donation Alerts',
        description: 'Show alerts for donations/tips',
        default: true
      },
      enableCheerAlerts: {
        type: 'boolean',
        title: 'Enable Cheer Alerts',
        description: 'Show alerts for bits/cheers',
        default: true
      },
      alertDuration: {
        type: 'number',
        title: 'Alert Duration (seconds)',
        description: 'How long each alert displays',
        default: 5,
        minimum: 1,
        maximum: 30
      },
      animationStyle: {
        type: 'string',
        title: 'Animation Style',
        description: 'Choose alert animation style',
        default: 'slideIn',
        enum: ['slideIn', 'fadeIn', 'bounceIn', 'zoomIn', 'spinIn']
      },
      soundEnabled: {
        type: 'boolean',
        title: 'Enable Alert Sounds',
        description: 'Play sound effects with alerts',
        default: true
      },
      soundVolume: {
        type: 'number',
        title: 'Sound Volume',
        description: 'Alert sound volume (0-100)',
        default: 70,
        minimum: 0,
        maximum: 100
      },
      ttsEnabled: {
        type: 'boolean',
        title: 'Enable Text-to-Speech',
        description: 'Read alert messages with TTS',
        default: false
      },
      minRaidViewers: {
        type: 'number',
        title: 'Minimum Raid Viewers',
        description: 'Only show raid alerts above this viewer count',
        default: 2,
        minimum: 1
      },
      minDonationAmount: {
        type: 'number',
        title: 'Minimum Donation Amount',
        description: 'Only show donation alerts above this amount',
        default: 1,
        minimum: 0
      },
      minCheerBits: {
        type: 'number',
        title: 'Minimum Cheer Bits',
        description: 'Only show cheer alerts above this bit count',
        default: 100,
        minimum: 1
      }
    }
  },
  
  // Lifecycle hooks
  initialize: async function(context) {
    moduleContext = context;
    
    // Get module configuration
    const config = await context.getConfig();
    
    context.logger.info('Alert System module initialized', { config });
    
    // Subscribe to platform events
    subscribeToEvents(context, config);
    
    // Start alert queue processor
    processAlertQueue();
  },
  
  stop: function() {
    if (moduleContext) {
      moduleContext.logger.info('Alert System module stopped');
    }
    
    // Clear alert queue
    alertQueue.length = 0;
    isProcessingAlert = false;
  },
  
  // Custom methods for testing
  testAlert: testAlert
};
