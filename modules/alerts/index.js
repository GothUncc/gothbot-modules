/**
 * Alert System Module
 * 
 * Multi-platform stream alerts using OBS Control module for dynamic overlay management.
 * Subscribes to platform events and displays alerts via OBS WebSocket.
 * 
 * REQUIRES: obs-control module to be installed and enabled
 */

// Store module context globally
let moduleContext = null;

/**
 * Subscribe to platform events based on configuration
 */
function subscribeToEvents(ctx, config) {
  // Check if OBS Control is available
  if (!ctx.obsApi) {
    ctx.logger.error('OBS Control module is required but not available');
    ctx.logger.error('Please install and enable the obs-control module first');
    return;
  }

  ctx.logger.info('Alert System using OBS Control module');

  // Follow events
  if (config.enableFollowAlerts) {
    ctx.on('follow', async function(event) {
      try {
        await ctx.obsApi.showAlert({
          type: 'follow',
          username: event.data.displayName || event.data.username,
          message: (event.data.displayName || event.data.username) + ' just followed!',
          duration: (config.alertDuration || 5) * 1000,
          scene: config.alertScene || null
        });
      } catch (error) {
        ctx.logger.error('Failed to show follow alert', { error: error.message });
      }
    });
  }
  
  // Subscribe events
  if (config.enableSubscribeAlerts) {
    ctx.on('subscribe', async function(event) {
      try {
        const tier = event.data.tier || 1;
        const months = event.data.months || 1;
        let message = (event.data.displayName || event.data.username) + ' subscribed';
        
        if (months > 1) {
          message += ' for ' + months + ' months!';
        } else {
          message += '!';
        }
        
        if (tier > 1) {
          message += ' (Tier ' + tier + ')';
        }
        
        await ctx.obsApi.showAlert({
          type: 'subscribe',
          username: event.data.displayName || event.data.username,
          message: message,
          tier: tier,
          months: months,
          duration: (config.alertDuration || 5) * 1000,
          scene: config.alertScene || null
        });
      } catch (error) {
        ctx.logger.error('Failed to show subscribe alert', { error: error.message });
      }
    });
  }
  
  // Raid events
  if (config.enableRaidAlerts) {
    ctx.on('raid', async function(event) {
      try {
        const viewers = event.data.viewerCount || 0;
        
        if (viewers >= config.minRaidViewers) {
          await ctx.obsApi.showAlert({
            type: 'raid',
            username: event.data.displayName || event.data.username,
            message: (event.data.displayName || event.data.username) + ' is raiding with ' + viewers + ' viewers!',
            viewers: viewers,
            duration: (config.alertDuration || 5) * 1000,
            scene: config.alertScene || null
          });
        }
      } catch (error) {
        ctx.logger.error('Failed to show raid alert', { error: error.message });
      }
    });
  }
  
  // Donation events
  if (config.enableDonationAlerts) {
    ctx.on('donation', async function(event) {
      try {
        const amount = event.data.amount || 0;
        
        if (amount >= config.minDonationAmount) {
          const currency = event.data.currency || 'USD';
          await ctx.obsApi.showAlert({
            type: 'donation',
            username: event.data.displayName || event.data.username,
            message: (event.data.displayName || event.data.username) + ' donated ' + currency + ' ' + amount + '!',
            amount: amount,
            currency: currency,
            userMessage: event.data.message || '',
            duration: (config.alertDuration || 5) * 1000,
            scene: config.alertScene || null
          });
        }
      } catch (error) {
        ctx.logger.error('Failed to show donation alert', { error: error.message });
      }
    });
  }
  
  // Cheer/Bits events
  if (config.enableCheerAlerts) {
    ctx.on('cheer', async function(event) {
      try {
        const amount = event.data.bits || event.data.amount || 0;
        
        if (amount >= config.minCheerBits) {
          await ctx.obsApi.showAlert({
            type: 'cheer',
            username: event.data.displayName || event.data.username,
            message: (event.data.displayName || event.data.username) + ' cheered ' + amount + ' bits!',
            amount: amount,
            userMessage: event.data.message || '',
            duration: (config.alertDuration || 5) * 1000,
            scene: config.alertScene || null
          });
        }
      } catch (error) {
        ctx.logger.error('Failed to show cheer alert', { error: error.message });
      }
    });
  }
}

/**
 * Test alert endpoint - triggers a test alert via OBS Control
 */
async function testAlert(ctx, type) {
  const alertType = type || 'follow';
  
  if (!ctx.obsApi) {
    return {
      success: false,
      error: 'OBS Control module not available'
    };
  }

  const config = await ctx.getConfig();
  
  const testAlerts = {
    follow: {
      type: 'follow',
      username: 'TestFollower',
      message: 'TestFollower just followed!',
      duration: (config.alertDuration || 5) * 1000
    },
    subscribe: {
      type: 'subscribe',
      username: 'TestSubscriber',
      message: 'TestSubscriber subscribed!',
      tier: 1,
      months: 1,
      duration: (config.alertDuration || 5) * 1000
    },
    raid: {
      type: 'raid',
      username: 'TestRaider',
      message: 'TestRaider is raiding with 50 viewers!',
      viewers: 50,
      duration: (config.alertDuration || 5) * 1000
    },
    donation: {
      type: 'donation',
      username: 'TestDonor',
      message: 'TestDonor donated USD 5.00!',
      amount: 5.00,
      currency: 'USD',
      userMessage: 'Great stream!',
      duration: (config.alertDuration || 5) * 1000
    },
    cheer: {
      type: 'cheer',
      username: 'TestCheerer',
      message: 'TestCheerer cheered 100 bits!',
      amount: 100,
      userMessage: 'Love the content!',
      duration: (config.alertDuration || 5) * 1000
    }
  };
  
  const alertConfig = testAlerts[alertType] || testAlerts.follow;
  
  try {
    const alertId = await ctx.obsApi.showAlert(alertConfig);
    
    ctx.logger.info('Test alert triggered', {
      type: alertType,
      alertId: alertId
    });
    
    return {
      success: true,
      message: 'Test ' + alertType + ' alert triggered',
      alertId: alertId
    };
  } catch (error) {
    ctx.logger.error('Failed to trigger test alert', {
      type: alertType,
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
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
      },
      alertScene: {
        type: 'string',
        title: 'Alert Scene',
        description: 'OBS scene name for alerts (leave empty for current scene)',
        default: '',
        required: false
      }
    }
  },
  
  // Lifecycle hooks
  initialize: async function(context) {
    moduleContext = context;
    
    // Get module configuration
    const config = await context.getConfig();
    
    // Check if OBS Control is available
    if (!context.obsApi) {
      context.logger.error('Alert System requires OBS Control module');
      context.logger.error('Please install and enable obs-control module first');
      throw new Error('OBS Control module dependency not met');
    }
    
    context.logger.info('Alert System module initialized with OBS Control', { config });
    
    // Subscribe to platform events
    subscribeToEvents(context, config);
  },
  
  stop: function() {
    if (moduleContext) {
      moduleContext.logger.info('Alert System module stopped');
    }
    
    moduleContext = null;
  },
  
  // Custom methods for testing
  testAlert: testAlert
};
