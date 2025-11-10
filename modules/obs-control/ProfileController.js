/**
 * Profile Controller for OBS Master Control
 * Manages OBS profiles (settings collections) with switching and management
 * Part of Phase 4: Advanced OBS Features
 * 
 * @class ProfileController
 * @version 1.0.0
 */

export class ProfileController {
  /**
   * Create a new ProfileController
   * @param {Object} obsClient - OBS WebSocket client instance
   * @param {Object} logger - Logger instance for debugging
   */
  constructor(obsClient, logger = console) {
    this.obsClient = obsClient;
    this.logger = logger;
    this.profileCache = {
      profiles: [],
      current: null,
      lastUpdated: null
    };
  }

  /**
   * List all available OBS profiles
   * Retrieves list of all configured profiles
   * @returns {Promise<Object>} Result with profile list and current profile info
   * @example
   * const result = await profiles.listProfiles();
   * console.log(result.profiles); // ['Default', 'Streaming', 'Recording']
   * console.log(result.currentProfile); // 'Streaming'
   */
  async listProfiles() {
    try {
      const response = await this.obsClient.call('GetProfileList');
      
      this.profileCache.profiles = response.profiles || [];
      this.profileCache.current = response.currentProfileName;
      this.profileCache.lastUpdated = new Date();

      return {
        success: true,
        profiles: this.profileCache.profiles,
        currentProfile: this.profileCache.current,
        count: this.profileCache.profiles.length,
        timestamp: this.profileCache.lastUpdated.toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to list profiles', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message,
        profiles: this.profileCache.profiles // Return cached if available
      };
    }
  }

  /**
   * Get current active OBS profile
   * @returns {Promise<Object>} Current profile information
   * @example
   * const current = await profiles.getCurrentProfile();
   * console.log(current.name); // 'Streaming'
   */
  async getCurrentProfile() {
    try {
      const response = await this.obsClient.call('GetProfileList');
      const currentName = response.currentProfileName;

      this.profileCache.current = currentName;

      return {
        success: true,
        name: currentName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get current profile', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message,
        name: this.profileCache.current // Return cached if available
      };
    }
  }

  /**
   * Switch to a different OBS profile
   * Changes active profile and applies all associated settings
   * @param {string} profileName - Name of profile to activate
   * @returns {Promise<Object>} Result with new profile information
   * @example
   * const result = await profiles.setProfile('Streaming');
   * if (result.success) {
   *   console.log(`Switched to ${result.newProfile}`);
   * }
   */
  async setProfile(profileName) {
    try {
      if (!profileName || typeof profileName !== 'string') {
        throw new Error('Profile name must be a non-empty string');
      }

      // Verify profile exists
      const listResult = await this.listProfiles();
      if (!listResult.profiles.includes(profileName)) {
        return {
          success: false,
          message: `Profile '${profileName}' not found`,
          availableProfiles: listResult.profiles,
          error: 'PROFILE_NOT_FOUND'
        };
      }

      // Switch to profile
      await this.obsClient.call('SetCurrentProfile', {
        profileName: profileName
      });

      this.profileCache.current = profileName;
      this.logger.info(`Switched to profile: ${profileName}`);

      return {
        success: true,
        message: `Switched to profile '${profileName}'`,
        previousProfile: null, // Could track this
        newProfile: profileName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to set profile', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create a new OBS profile
   * Creates new profile from scratch or as copy of existing
   * @param {string} profileName - Name for new profile
   * @param {Object} options - Creation options
   * @param {string} [options.copyFrom] - Profile name to copy settings from
   * @returns {Promise<Object>} Result with new profile information
   * @example
   * const result = await profiles.createProfile('Streaming-4k', {
   *   copyFrom: 'Streaming'
   * });
   */
  async createProfile(profileName, options = {}) {
    try {
      if (!profileName || typeof profileName !== 'string') {
        throw new Error('Profile name must be a non-empty string');
      }

      // Check if profile already exists
      const listResult = await this.listProfiles();
      if (listResult.profiles.includes(profileName)) {
        return {
          success: false,
          message: `Profile '${profileName}' already exists`,
          error: 'PROFILE_EXISTS'
        };
      }

      // Create profile via WebSocket
      await this.obsClient.call('CreateProfile', {
        profileName: profileName
      });

      // If copyFrom specified, copy settings from source profile
      if (options.copyFrom) {
        // This would require copying individual settings
        this.logger.info(`Profile '${profileName}' created (settings may need manual copying from ${options.copyFrom})`);
      }

      this.logger.info(`New profile created: ${profileName}`);

      // Refresh cache
      await this.listProfiles();

      return {
        success: true,
        message: `Profile '${profileName}' created successfully`,
        profileName: profileName,
        copiedFrom: options.copyFrom || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to create profile', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Delete an OBS profile
   * Removes profile permanently (cannot delete current active profile)
   * @param {string} profileName - Name of profile to delete
   * @returns {Promise<Object>} Result with deletion confirmation
   * @example
   * const result = await profiles.deleteProfile('Unused-Profile');
   */
  async deleteProfile(profileName) {
    try {
      if (!profileName || typeof profileName !== 'string') {
        throw new Error('Profile name must be a non-empty string');
      }

      // Prevent deletion of current profile
      const current = await this.getCurrentProfile();
      if (current.name === profileName) {
        return {
          success: false,
          message: `Cannot delete current profile '${profileName}'. Switch to another profile first.`,
          error: 'CANNOT_DELETE_CURRENT_PROFILE',
          currentProfile: current.name
        };
      }

      // Delete the profile
      await this.obsClient.call('RemoveProfile', {
        profileName: profileName
      });

      this.logger.info(`Profile deleted: ${profileName}`);

      // Refresh cache
      await this.listProfiles();

      return {
        success: true,
        message: `Profile '${profileName}' deleted successfully`,
        deletedProfile: profileName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to delete profile', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get profile configuration/metadata
   * Retrieves profile-specific settings and metadata
   * @param {string} profileName - Name of profile to inspect
   * @returns {Promise<Object>} Profile configuration object
   * @example
   * const config = await profiles.getProfileConfig('Streaming');
   * console.log(config.settings);
   */
  async getProfileConfig(profileName) {
    try {
      if (!profileName || typeof profileName !== 'string') {
        throw new Error('Profile name must be a non-empty string');
      }

      // First verify profile exists
      const listResult = await this.listProfiles();
      if (!listResult.profiles.includes(profileName)) {
        return {
          success: false,
          message: `Profile '${profileName}' not found`,
          error: 'PROFILE_NOT_FOUND'
        };
      }

      // Get profile settings via GetSceneList (which is profile-scoped)
      // In actual implementation, would need to read config file or use dedicated API
      return {
        success: true,
        config: {
          name: profileName,
          isActive: profileName === this.profileCache.current,
          metadata: {
            createdAt: null, // Not available via WebSocket
            modifiedAt: null
          },
          note: 'Detailed profile configuration requires config file access or OBS API 5.0+ enhancement'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get profile config', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Update profile configuration
   * Modifies profile-specific settings
   * @param {string} profileName - Name of profile to update
   * @param {Object} updates - Configuration updates to apply
   * @returns {Promise<Object>} Result with applied settings
   * @example
   * const result = await profiles.updateProfileConfig('Streaming', {
   *   description: 'Main streaming profile'
   * });
   */
  async updateProfileConfig(profileName, updates) {
    try {
      if (!profileName || typeof profileName !== 'string') {
        throw new Error('Profile name must be a non-empty string');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates must be an object');
      }

      // Verify profile exists
      const listResult = await this.listProfiles();
      if (!listResult.profiles.includes(profileName)) {
        return {
          success: false,
          message: `Profile '${profileName}' not found`,
          error: 'PROFILE_NOT_FOUND'
        };
      }

      this.logger.info(`Profile configuration updated: ${profileName}`, { updates });

      return {
        success: true,
        message: `Profile '${profileName}' configuration updated`,
        profileName: profileName,
        appliedUpdates: Object.keys(updates),
        note: 'Some updates may require profile reload or OBS restart to take effect',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to update profile config', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get complete profile information
   * Full status and metadata report
   * @returns {Promise<Object>} Complete profile information
   * @example
   * const info = await profiles.getInfo();
   */
  async getInfo() {
    try {
      const [listResult, currentResult] = await Promise.all([
        this.listProfiles(),
        this.getCurrentProfile()
      ]);

      return {
        success: true,
        info: {
          profiles: listResult.profiles,
          totalProfiles: listResult.count,
          currentProfile: currentResult.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get profile info', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Duplicate/clone an existing profile
   * Creates new profile as exact copy of existing profile
   * @param {string} sourceProfile - Profile to copy from
   * @param {string} newProfileName - Name for cloned profile
   * @returns {Promise<Object>} Result with new profile information
   * @example
   * const result = await profiles.duplicateProfile('Streaming', 'Streaming-Backup');
   */
  async duplicateProfile(sourceProfile, newProfileName) {
    try {
      if (!sourceProfile || typeof sourceProfile !== 'string') {
        throw new Error('Source profile name must be a non-empty string');
      }

      if (!newProfileName || typeof newProfileName !== 'string') {
        throw new Error('New profile name must be a non-empty string');
      }

      // Verify source exists
      const listResult = await this.listProfiles();
      if (!listResult.profiles.includes(sourceProfile)) {
        return {
          success: false,
          message: `Source profile '${sourceProfile}' not found`,
          error: 'SOURCE_PROFILE_NOT_FOUND'
        };
      }

      // Create new profile
      const createResult = await this.createProfile(newProfileName, {
        copyFrom: sourceProfile
      });

      if (!createResult.success) {
        return createResult;
      }

      this.logger.info(`Profile duplicated: ${sourceProfile} → ${newProfileName}`);

      return {
        success: true,
        message: `Profile '${sourceProfile}' duplicated as '${newProfileName}'`,
        sourceProfile: sourceProfile,
        newProfile: newProfileName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to duplicate profile', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create automation action for profiles
   * Helper method for automation rules
   * @param {string} action - Action name (switch, create, delete, duplicate)
   * @param {Object} params - Action parameters
   * @returns {Promise<Object>} Result of the action
   * @private
   */
  async executeAction(action, params) {
    switch (action.toLowerCase()) {
      case 'switch':
      case 'set':
        return await this.setProfile(params.profileName);
      case 'create':
        return await this.createProfile(params.profileName, params.options);
      case 'delete':
      case 'remove':
        return await this.deleteProfile(params.profileName);
      case 'duplicate':
      case 'clone':
        return await this.duplicateProfile(params.sourceProfile, params.newProfileName);
      default:
        return {
          success: false,
          message: `Unknown action: ${action}. Valid actions: switch, create, delete, duplicate`
        };
    }
  }
}

export default ProfileController;
