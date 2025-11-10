import { building } from '$app/environment';
import { getModuleContext } from './shared-context.js';

// WebSocket connection management
const wsConnections = new Set();

/**
 * Handle WebSocket upgrade requests
 * SvelteKit hook to intercept WebSocket connections
 */
export async function handle({ event, resolve }) {
	// Skip WebSocket handling during build
	if (building) {
		return resolve(event);
	}

	// Inject module context into locals for API routes and WebSocket
	const { context, obsServices, alertEngine, automationEngine } = getModuleContext();
	event.locals.moduleContext = {
		obs: obsServices,
		alert: alertEngine,
		automation: automationEngine,
		context: context
	};

	// Check if this is a WebSocket upgrade request
	const upgrade = event.request.headers.get('upgrade');
	if (upgrade === 'websocket') {
		// Get the underlying Node.js request for WebSocket upgrade
		// This is handled by the WebSocket library
		const { websocket } = event;

		if (!websocket) {
			return new Response('WebSocket not supported', { status: 426 });
		}

		// Get the module context for OBS controllers
		const moduleContext = event.locals.moduleContext;

		// Accept the WebSocket connection
		const { socket, response } = websocket.accept();

		// Create connection handler
		const connection = new WebSocketConnection(socket, moduleContext);

		// Store connection
		wsConnections.add(connection);

		// Clean up on close
		socket.addEventListener('close', () => {
			wsConnections.delete(connection);
			connection.cleanup();
		});

		return response;
	}

	return resolve(event);
}

/**
 * Broadcast a message to all connected WebSocket clients
 * @param {Object} message - Message to broadcast
 * @param {string} message.type - Message type
 * @param {*} message.data - Message data
 */
export function broadcastWebSocketMessage(message) {
	const payload = JSON.stringify(message);
	wsConnections.forEach(connection => {
		try {
			connection.send(payload);
		} catch (err) {
			console.error('[WebSocket] Broadcast error:', err);
		}
	});
}

/**
 * WebSocket connection handler class
 */
class WebSocketConnection {
	constructor(socket, moduleContext) {
		this.socket = socket;
		this.moduleContext = moduleContext;
		this.isAlive = true;
		this.handlers = new Map();

		// Set up message handling
		socket.addEventListener('message', (event) => this.handleMessage(event));
		socket.addEventListener('error', (event) => this.handleError(event));
		socket.addEventListener('close', () => this.handleClose());

		// Send initial server status
		this.sendServerStatus();

		// Set up heartbeat to detect dead connections
		this.heartbeatInterval = setInterval(() => {
			if (this.isAlive === false) {
				this.socket.close();
				return;
			}
			this.isAlive = false;
			this.socket.ping();
		}, 30000);

		this.registerHandlers();

		console.log('[WebSocket] New connection established');
	}

	/**
	 * Register message handlers for different action types
	 */
	registerHandlers() {
		this.handlers.set('getServerStatus', () => this.sendServerStatus());
		this.handlers.set('SetCurrentProfile', (data) => this.handleSetProfile(data));
		this.handlers.set('CreateProfile', (data) => this.handleCreateProfile(data));
		this.handlers.set('DeleteProfile', (data) => this.handleDeleteProfile(data));
		this.handlers.set('SetCurrentCollection', (data) => this.handleSetCollection(data));
		this.handlers.set('CreateCollection', (data) => this.handleCreateCollection(data));
		this.handlers.set('DeleteCollection', (data) => this.handleDeleteCollection(data));
		this.handlers.set('ExportCollection', (data) => this.handleExportCollection(data));
		this.handlers.set('SetBaseResolution', (data) => this.handleSetBaseResolution(data));
		this.handlers.set('SetScaledResolution', (data) => this.handleSetScaledResolution(data));
		this.handlers.set('SetFrameRate', (data) => this.handleSetFrameRate(data));
		this.handlers.set('SetVideoFormat', (data) => this.handleSetVideoFormat(data));
		this.handlers.set('ApplyResolutionPreset', (data) => this.handleApplyPreset(data));
		this.handlers.set('StartReplayBuffer', () => this.handleStartReplayBuffer());
		this.handlers.set('StopReplayBuffer', () => this.handleStopReplayBuffer());
		this.handlers.set('ToggleReplayBuffer', () => this.handleToggleReplayBuffer());
		this.handlers.set('SaveReplayBuffer', () => this.handleSaveReplayBuffer());
		this.handlers.set('SetReplayBufferDuration', (data) => this.handleSetReplayBufferDuration(data));
		this.handlers.set('StartVirtualCamera', () => this.handleStartVirtualCamera());
		this.handlers.set('StopVirtualCamera', () => this.handleStopVirtualCamera());
		this.handlers.set('ToggleVirtualCamera', () => this.handleToggleVirtualCamera());
		this.handlers.set('SetVirtualCameraFormat', (data) => this.handleSetVirtualCameraFormat(data));
		this.handlers.set('CreateAutomation', (data) => this.handleCreateAutomation(data));
		this.handlers.set('UpdateAutomation', (data) => this.handleUpdateAutomation(data));
		this.handlers.set('ExecuteAutomation', (data) => this.handleExecuteAutomation(data));
		this.handlers.set('DeleteAutomation', (data) => this.handleDeleteAutomation(data));
		this.handlers.set('TestAlert', (data) => this.handleTestAlert(data));
	}

	/**
	 * Handle incoming WebSocket message
	 */
	async handleMessage(event) {
		try {
			const message = JSON.parse(event.data);
			this.isAlive = true;

			const handler = this.handlers.get(message.type);
			if (handler) {
				await handler.call(this, message.data || {});
			} else {
				console.log('[WebSocket] Unknown message type:', message.type);
				this.send({
					type: 'Error',
					errorMessage: `Unknown message type: ${message.type}`
				});
			}
		} catch (err) {
			console.error('[WebSocket] Message handling error:', err);
			this.send({
				type: 'Error',
				errorMessage: 'Failed to process message'
			});
		}
	}

	/**
	 * Send message to this connection
	 */
	send(data) {
		try {
			this.socket.send(JSON.stringify(data));
		} catch (err) {
			console.error('[WebSocket] Send error:', err);
		}
	}

	/**
	 * Send server status to client
	 */
	async sendServerStatus() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) {
				this.send({
					type: 'ServerStatus',
					connected: false,
					version: 'unknown',
					platform: process.platform
				});
				return;
			}

			const status = await obs.getConnectionStatus?.();
			this.send({
				type: 'ServerStatus',
				connected: status?.connected || false,
				version: status?.version || 'unknown',
				platform: process.platform,
				uptime: status?.uptime || 0
			});
		} catch (err) {
			console.error('[WebSocket] Error sending server status:', err);
			this.send({
				type: 'Error',
				errorMessage: 'Failed to get server status'
			});
		}
	}

	// Profile Handlers
	async handleSetProfile(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { profileName } = data;
			await obs.setProfile?.(profileName);

			// Broadcast update to all clients
			broadcastWebSocketMessage({
				type: 'ProfileChanged',
				profile: profileName
			});

			this.send({ type: 'Success', message: 'Profile switched' });
		} catch (err) {
			console.error('[WebSocket] Profile switch error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to switch profile: ${err.message}`
			});
		}
	}

	async handleCreateProfile(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { profileName } = data;
			await obs.createProfile?.(profileName);

			this.send({ type: 'Success', message: 'Profile created' });
		} catch (err) {
			console.error('[WebSocket] Profile create error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to create profile: ${err.message}`
			});
		}
	}

	async handleDeleteProfile(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { profileName } = data;
			await obs.deleteProfile?.(profileName);

			this.send({ type: 'Success', message: 'Profile deleted' });
		} catch (err) {
			console.error('[WebSocket] Profile delete error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to delete profile: ${err.message}`
			});
		}
	}

	// Collection Handlers
	async handleSetCollection(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { collectionName } = data;
			await obs.setCollection?.(collectionName);

			broadcastWebSocketMessage({
				type: 'SceneCollectionChanged',
				collection: collectionName
			});

			this.send({ type: 'Success', message: 'Collection switched' });
		} catch (err) {
			console.error('[WebSocket] Collection switch error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to switch collection: ${err.message}`
			});
		}
	}

	async handleCreateCollection(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { collectionName } = data;
			await obs.createCollection?.(collectionName);

			this.send({ type: 'Success', message: 'Collection created' });
		} catch (err) {
			console.error('[WebSocket] Collection create error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to create collection: ${err.message}`
			});
		}
	}

	async handleDeleteCollection(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { collectionName } = data;
			await obs.deleteCollection?.(collectionName);

			this.send({ type: 'Success', message: 'Collection deleted' });
		} catch (err) {
			console.error('[WebSocket] Collection delete error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to delete collection: ${err.message}`
			});
		}
	}

	async handleExportCollection(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { collectionName } = data;
			const path = await obs.exportCollection?.(collectionName);

			this.send({
				type: 'Success',
				message: 'Collection exported',
				path
			});
		} catch (err) {
			console.error('[WebSocket] Collection export error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to export collection: ${err.message}`
			});
		}
	}

	// Video Settings Handlers
	async handleSetBaseResolution(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { width, height } = data;
			await obs.setBaseResolution?.(width, height);

			broadcastWebSocketMessage({
				type: 'VideoSettingsChanged',
				settings: {
					baseResolution: { width, height }
				}
			});

			this.send({ type: 'Success', message: 'Base resolution updated' });
		} catch (err) {
			console.error('[WebSocket] Base resolution error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set resolution: ${err.message}`
			});
		}
	}

	async handleSetScaledResolution(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { width, height } = data;
			await obs.setScaledResolution?.(width, height);

			broadcastWebSocketMessage({
				type: 'VideoSettingsChanged',
				settings: {
					scaledResolution: { width, height }
				}
			});

			this.send({ type: 'Success', message: 'Scaled resolution updated' });
		} catch (err) {
			console.error('[WebSocket] Scaled resolution error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set scaled resolution: ${err.message}`
			});
		}
	}

	async handleSetFrameRate(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { fps } = data;
			await obs.setFrameRate?.(fps);

			broadcastWebSocketMessage({
				type: 'VideoSettingsChanged',
				settings: {
					frameRate: fps
				}
			});

			this.send({ type: 'Success', message: 'Frame rate updated' });
		} catch (err) {
			console.error('[WebSocket] Frame rate error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set frame rate: ${err.message}`
			});
		}
	}

	async handleSetVideoFormat(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { format } = data;
			await obs.setFormat?.(format);

			broadcastWebSocketMessage({
				type: 'VideoSettingsChanged',
				settings: {
					videoFormat: format
				}
			});

			this.send({ type: 'Success', message: 'Video format updated' });
		} catch (err) {
			console.error('[WebSocket] Video format error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set video format: ${err.message}`
			});
		}
	}

	async handleApplyPreset(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { preset, targetType } = data;
			await obs.applyPreset?.(preset, targetType);

			this.send({ type: 'Success', message: 'Preset applied' });
		} catch (err) {
			console.error('[WebSocket] Preset apply error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to apply preset: ${err.message}`
			});
		}
	}

	// Replay Buffer Handlers
	async handleStartReplayBuffer() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			await obs.startReplayBuffer?.();

			broadcastWebSocketMessage({
				type: 'ReplayBufferStateChanged',
				state: { active: true }
			});

			this.send({ type: 'Success', message: 'Replay buffer started' });
		} catch (err) {
			console.error('[WebSocket] Replay buffer start error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to start replay buffer: ${err.message}`
			});
		}
	}

	async handleStopReplayBuffer() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			await obs.stopReplayBuffer?.();

			broadcastWebSocketMessage({
				type: 'ReplayBufferStateChanged',
				state: { active: false }
			});

			this.send({ type: 'Success', message: 'Replay buffer stopped' });
		} catch (err) {
			console.error('[WebSocket] Replay buffer stop error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to stop replay buffer: ${err.message}`
			});
		}
	}

	async handleToggleReplayBuffer() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const status = await obs.getStatus?.();
			if (status?.replayBufferActive) {
				await obs.stopReplayBuffer?.();
			} else {
				await obs.startReplayBuffer?.();
			}

			this.send({ type: 'Success', message: 'Replay buffer toggled' });
		} catch (err) {
			console.error('[WebSocket] Replay buffer toggle error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to toggle replay buffer: ${err.message}`
			});
		}
	}

	async handleSaveReplayBuffer() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			await obs.saveReplayBuffer?.();

			this.send({ type: 'Success', message: 'Replay buffer saved' });
		} catch (err) {
			console.error('[WebSocket] Replay buffer save error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to save replay buffer: ${err.message}`
			});
		}
	}

	async handleSetReplayBufferDuration(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { maxSeconds } = data;
			if (maxSeconds < 5 || maxSeconds > 3600) {
				throw new Error('Duration must be between 5 and 3600 seconds');
			}

			await obs.setMaxReplayBufferSeconds?.(maxSeconds);

			this.send({ type: 'Success', message: 'Replay buffer duration updated' });
		} catch (err) {
			console.error('[WebSocket] Replay buffer duration error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set replay buffer duration: ${err.message}`
			});
		}
	}

	// Virtual Camera Handlers
	async handleStartVirtualCamera() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			await obs.startVirtualCamera?.();

			broadcastWebSocketMessage({
				type: 'VirtualCameraStateChanged',
				state: { active: true }
			});

			this.send({ type: 'Success', message: 'Virtual camera started' });
		} catch (err) {
			console.error('[WebSocket] Virtual camera start error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to start virtual camera: ${err.message}`
			});
		}
	}

	async handleStopVirtualCamera() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			await obs.stopVirtualCamera?.();

			broadcastWebSocketMessage({
				type: 'VirtualCameraStateChanged',
				state: { active: false }
			});

			this.send({ type: 'Success', message: 'Virtual camera stopped' });
		} catch (err) {
			console.error('[WebSocket] Virtual camera stop error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to stop virtual camera: ${err.message}`
			});
		}
	}

	async handleToggleVirtualCamera() {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const status = await obs.getStatus?.();
			if (status?.virtualCameraActive) {
				await obs.stopVirtualCamera?.();
			} else {
				await obs.startVirtualCamera?.();
			}

			this.send({ type: 'Success', message: 'Virtual camera toggled' });
		} catch (err) {
			console.error('[WebSocket] Virtual camera toggle error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to toggle virtual camera: ${err.message}`
			});
		}
	}

	async handleSetVirtualCameraFormat(data) {
		try {
			const obs = this.moduleContext?.obs;
			if (!obs) throw new Error('OBS module not available');

			const { format } = data;
			await obs.setVirtualCameraFormat?.(format);

			broadcastWebSocketMessage({
				type: 'VirtualCameraStateChanged',
				state: { outputFormat: format }
			});

			this.send({ type: 'Success', message: 'Virtual camera format updated' });
		} catch (err) {
			console.error('[WebSocket] Virtual camera format error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to set virtual camera format: ${err.message}`
			});
		}
	}

	// Automation Handlers
	async handleCreateAutomation(data) {
		try {
			const automationController = this.moduleContext?.automation;
			if (!automationController) throw new Error('Automation module not available');

			const { name, trigger, action, enabled, triggerValue } = data;
			const automation = await automationController.createAutomation?.({
				name,
				trigger,
				action,
				enabled,
				triggerValue
			});

			this.send({
				type: 'Success',
				message: 'Automation created',
				automation
			});
		} catch (err) {
			console.error('[WebSocket] Automation create error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to create automation: ${err.message}`
			});
		}
	}

	async handleUpdateAutomation(data) {
		try {
			const automationController = this.moduleContext?.automation;
			if (!automationController) throw new Error('Automation module not available');

			const { id, enabled } = data;
			await automationController.updateAutomation?.(id, { enabled });

			this.send({ type: 'Success', message: 'Automation updated' });
		} catch (err) {
			console.error('[WebSocket] Automation update error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to update automation: ${err.message}`
			});
		}
	}

	async handleExecuteAutomation(data) {
		try {
			const automationController = this.moduleContext?.automation;
			if (!automationController) throw new Error('Automation module not available');

			const { id } = data;
			await automationController.executeAutomation?.(id);

			this.send({ type: 'Success', message: 'Automation executed' });
		} catch (err) {
			console.error('[WebSocket] Automation execute error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to execute automation: ${err.message}`
			});
		}
	}

	async handleDeleteAutomation(data) {
		try {
			const automationController = this.moduleContext?.automation;
			if (!automationController) throw new Error('Automation module not available');

			const { id } = data;
			await automationController.deleteAutomation?.(id);

			this.send({ type: 'Success', message: 'Automation deleted' });
		} catch (err) {
			console.error('[WebSocket] Automation delete error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to delete automation: ${err.message}`
			});
		}
	}

	// Alert Handler
	async handleTestAlert(data) {
		try {
			const alertController = this.moduleContext?.alerts;
			if (!alertController) throw new Error('Alerts module not available');

			const { alertType, testData } = data;
			await alertController.testAlert?.(alertType, testData);

			this.send({
				type: 'Success',
				message: 'Alert test triggered'
			});
		} catch (err) {
			console.error('[WebSocket] Alert test error:', err);
			this.send({
				type: 'Error',
				errorMessage: `Failed to test alert: ${err.message}`
			});
		}
	}

	/**
	 * Handle WebSocket errors
	 */
	handleError(event) {
		console.error('[WebSocket] Connection error:', event);
	}

	/**
	 * Handle WebSocket close
	 */
	handleClose() {
		console.log('[WebSocket] Connection closed');
		this.cleanup();
	}

	/**
	 * Clean up resources
	 */
	cleanup() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}
		this.handlers.clear();
	}
}
