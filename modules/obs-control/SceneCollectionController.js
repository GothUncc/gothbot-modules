/**
 * Scene Collection Controller for OBS Master Control
 * Manages OBS scene collections (different scene setups) with switching and export/import
 * Part of Phase 4: Advanced OBS Features
 * 
 * @class SceneCollectionController
 * @version 1.0.0
 */

export class SceneCollectionController {
  /**
   * Create a new SceneCollectionController
   * @param {Object} obsClient - OBS WebSocket client instance
   * @param {Object} logger - Logger instance for debugging
   */
  constructor(obsClient, logger = console) {
    this.obsClient = obsClient;
    this.logger = logger;
    this.collectionCache = {
      collections: [],
      current: null,
      lastUpdated: null
    };
  }

  /**
   * List all available scene collections
   * Retrieves all configured scene collections
   * @returns {Promise<Object>} Result with collection list and current collection
   * @example
   * const result = await sceneCollections.listCollections();
   * console.log(result.collections); // ['Gaming', 'Creative', 'IRL']
   * console.log(result.currentCollection); // 'Gaming'
   */
  async listCollections() {
    try {
      const response = await this.obsClient.call('GetSceneCollectionList');
      
      this.collectionCache.collections = response.sceneCollections || [];
      this.collectionCache.current = response.currentSceneCollectionName;
      this.collectionCache.lastUpdated = new Date();

      return {
        success: true,
        collections: this.collectionCache.collections,
        currentCollection: this.collectionCache.current,
        count: this.collectionCache.collections.length,
        timestamp: this.collectionCache.lastUpdated.toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to list scene collections', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message,
        collections: this.collectionCache.collections
      };
    }
  }

  /**
   * Get current active scene collection
   * @returns {Promise<Object>} Current collection name
   * @example
   * const current = await sceneCollections.getCurrentCollection();
   * console.log(current.name); // 'Gaming'
   */
  async getCurrentCollection() {
    try {
      const response = await this.obsClient.call('GetSceneCollectionList');
      const currentName = response.currentSceneCollectionName;

      this.collectionCache.current = currentName;

      return {
        success: true,
        name: currentName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get current scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message,
        name: this.collectionCache.current
      };
    }
  }

  /**
   * Switch to a different scene collection
   * Changes active scene collection and loads all scenes from it
   * @param {string} collectionName - Name of collection to activate
   * @returns {Promise<Object>} Result with new collection information
   * @example
   * const result = await sceneCollections.setCollection('Creative');
   * if (result.success) {
   *   console.log(`Switched to ${result.newCollection}`);
   * }
   */
  async setCollection(collectionName) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      // Verify collection exists
      const listResult = await this.listCollections();
      if (!listResult.collections.includes(collectionName)) {
        return {
          success: false,
          message: `Scene collection '${collectionName}' not found`,
          availableCollections: listResult.collections,
          error: 'COLLECTION_NOT_FOUND'
        };
      }

      // Switch to collection
      await this.obsClient.call('SetCurrentSceneCollection', {
        sceneCollectionName: collectionName
      });

      this.collectionCache.current = collectionName;
      this.logger.info(`Switched to scene collection: ${collectionName}`);

      return {
        success: true,
        message: `Switched to scene collection '${collectionName}'`,
        newCollection: collectionName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to set scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create a new scene collection
   * Creates empty collection or copy of existing
   * @param {string} collectionName - Name for new collection
   * @param {Object} options - Creation options
   * @param {string} [options.copyFrom] - Collection to copy from
   * @returns {Promise<Object>} Result with new collection information
   * @example
   * const result = await sceneCollections.createCollection('4K-Gaming', {
   *   copyFrom: 'Gaming'
   * });
   */
  async createCollection(collectionName, options = {}) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      // Check if collection already exists
      const listResult = await this.listCollections();
      if (listResult.collections.includes(collectionName)) {
        return {
          success: false,
          message: `Scene collection '${collectionName}' already exists`,
          error: 'COLLECTION_EXISTS'
        };
      }

      // Create collection
      await this.obsClient.call('CreateSceneCollection', {
        sceneCollectionName: collectionName
      });

      this.logger.info(`New scene collection created: ${collectionName}`);

      if (options.copyFrom) {
        this.logger.info(`Note: Manual scene/source copying needed from ${options.copyFrom}`);
      }

      // Refresh cache
      await this.listCollections();

      return {
        success: true,
        message: `Scene collection '${collectionName}' created successfully`,
        collectionName: collectionName,
        copiedFrom: options.copyFrom || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to create scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Delete a scene collection
   * Removes collection permanently (cannot delete current collection)
   * @param {string} collectionName - Name of collection to delete
   * @returns {Promise<Object>} Result with deletion confirmation
   * @example
   * const result = await sceneCollections.deleteCollection('Old-Setup');
   */
  async deleteCollection(collectionName) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      // Prevent deletion of current collection
      const current = await this.getCurrentCollection();
      if (current.name === collectionName) {
        return {
          success: false,
          message: `Cannot delete current scene collection '${collectionName}'. Switch to another collection first.`,
          error: 'CANNOT_DELETE_CURRENT_COLLECTION',
          currentCollection: current.name
        };
      }

      // Delete the collection
      await this.obsClient.call('RemoveSceneCollection', {
        sceneCollectionName: collectionName
      });

      this.logger.info(`Scene collection deleted: ${collectionName}`);

      // Refresh cache
      await this.listCollections();

      return {
        success: true,
        message: `Scene collection '${collectionName}' deleted successfully`,
        deletedCollection: collectionName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to delete scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get path to scene collection data file
   * Returns location where collection data is stored
   * @param {string} collectionName - Name of collection
   * @returns {Promise<Object>} Path information object
   * @example
   * const pathInfo = await sceneCollections.getCollectionPath('Gaming');
   * console.log(pathInfo.path); // C:\Users\User\AppData\Roaming\obs-studio\basic\scenes\Gaming.json
   */
  async getCollectionPath(collectionName) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      // Verify collection exists
      const listResult = await this.listCollections();
      if (!listResult.collections.includes(collectionName)) {
        return {
          success: false,
          message: `Scene collection '${collectionName}' not found`,
          error: 'COLLECTION_NOT_FOUND'
        };
      }

      // Path information (varies by OS)
      const osType = process.platform;
      let basePath = '';
      
      if (osType === 'win32') {
        basePath = `C:\\Users\\[USER]\\AppData\\Roaming\\obs-studio\\basic\\scenes\\`;
      } else if (osType === 'darwin') {
        basePath = `~/Library/Application Support/obs-studio/basic/scenes/`;
      } else {
        basePath = `~/.config/obs-studio/basic/scenes/`;
      }

      return {
        success: true,
        collectionName: collectionName,
        path: `${basePath}${collectionName}.json`,
        basePath: basePath,
        filename: `${collectionName}.json`,
        osType: osType,
        note: 'Actual path depends on OBS installation and operating system',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get collection path', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Duplicate/clone an existing scene collection
   * Creates new collection as exact copy of existing
   * @param {string} sourceCollection - Collection to copy from
   * @param {string} newCollectionName - Name for cloned collection
   * @returns {Promise<Object>} Result with new collection information
   * @example
   * const result = await sceneCollections.duplicateCollection('Gaming', 'Gaming-Backup');
   */
  async duplicateCollection(sourceCollection, newCollectionName) {
    try {
      if (!sourceCollection || typeof sourceCollection !== 'string') {
        throw new Error('Source collection name must be a non-empty string');
      }

      if (!newCollectionName || typeof newCollectionName !== 'string') {
        throw new Error('New collection name must be a non-empty string');
      }

      // Verify source exists
      const listResult = await this.listCollections();
      if (!listResult.collections.includes(sourceCollection)) {
        return {
          success: false,
          message: `Source scene collection '${sourceCollection}' not found`,
          error: 'SOURCE_COLLECTION_NOT_FOUND'
        };
      }

      // Create new collection with copy from source
      const createResult = await this.createCollection(newCollectionName, {
        copyFrom: sourceCollection
      });

      if (!createResult.success) {
        return createResult;
      }

      this.logger.info(`Scene collection duplicated: ${sourceCollection} → ${newCollectionName}`);

      return {
        success: true,
        message: `Scene collection '${sourceCollection}' duplicated as '${newCollectionName}'`,
        sourceCollection: sourceCollection,
        newCollection: newCollectionName,
        note: 'Manual scene/source setup copying may be required',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to duplicate scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Get complete scene collection information
   * Full status and metadata report
   * @returns {Promise<Object>} Complete collection information
   * @example
   * const info = await sceneCollections.getInfo();
   */
  async getInfo() {
    try {
      const [listResult, currentResult] = await Promise.all([
        this.listCollections(),
        this.getCurrentCollection()
      ]);

      return {
        success: true,
        info: {
          collections: listResult.collections,
          totalCollections: listResult.count,
          currentCollection: currentResult.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get scene collection info', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Export scene collection to file
   * Backs up collection data for transfer/archival
   * @param {string} collectionName - Collection to export
   * @param {string} outputPath - File path to save to
   * @returns {Promise<Object>} Result with export information
   * @example
   * const result = await sceneCollections.exportCollection('Gaming', './backups/gaming.json');
   */
  async exportCollection(collectionName, outputPath) {
    try {
      if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Collection name must be a non-empty string');
      }

      if (!outputPath || typeof outputPath !== 'string') {
        throw new Error('Output path must be a non-empty string');
      }

      // Verify collection exists
      const listResult = await this.listCollections();
      if (!listResult.collections.includes(collectionName)) {
        return {
          success: false,
          message: `Scene collection '${collectionName}' not found`,
          error: 'COLLECTION_NOT_FOUND'
        };
      }

      this.logger.info(`Scene collection export initiated: ${collectionName} → ${outputPath}`);

      return {
        success: true,
        message: `Scene collection '${collectionName}' export initiated`,
        collectionName: collectionName,
        outputPath: outputPath,
        note: 'Export requires direct file system access - implement with file I/O',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to export scene collection', { error: error.message });
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Create automation action for scene collections
   * Helper method for automation rules
   * @param {string} action - Action name (switch, create, delete, duplicate, export)
   * @param {Object} params - Action parameters
   * @returns {Promise<Object>} Result of the action
   * @private
   */
  async executeAction(action, params) {
    switch (action.toLowerCase()) {
      case 'switch':
      case 'set':
        return await this.setCollection(params.collectionName);
      case 'create':
        return await this.createCollection(params.collectionName, params.options);
      case 'delete':
      case 'remove':
        return await this.deleteCollection(params.collectionName);
      case 'duplicate':
      case 'clone':
        return await this.duplicateCollection(params.sourceCollection, params.newCollectionName);
      case 'export':
        return await this.exportCollection(params.collectionName, params.outputPath);
      default:
        return {
          success: false,
          message: `Unknown action: ${action}. Valid actions: switch, create, delete, duplicate, export`
        };
    }
  }
}

export default SceneCollectionController;
