/**
 * OBS Event Monitor
 * 
 * Monitors OBS controller state changes and broadcasts updates via WebSocket
 * Integrates with Phase 4 OBS controllers to track events
 */

import { broadcastWebSocketMessage } from '../hooks.server.js';

let stateCache = {
	currentScene: null,
	currentProfile: null,
	currentCollection: null,
	streamStatus: null,
	videoSettings: null,
	replayBufferState: null,
	virtualCameraState: null
};

let monitorInterval = null;

/**
 * Initialize OBS event monitoring
 * @param {Object} moduleContext - Module context with OBS controllers
 */
export function initializeOBSMonitoring(moduleContext) {
	if (monitorInterval) {
		return; // Already initialized
	}

	console.log('[OBS Monitor] Initializing OBS event monitoring');

	// Start monitoring loop
	monitorInterval = setInterval(() => {
		pollOBSState(moduleContext);
	}, 1000); // Poll every second for state changes

	// Also listen to controller events if available
	if (moduleContext?.obs?.on) {
		setupEventListeners(moduleContext);
	}
}

/**
 * Stop OBS event monitoring
 */
export function stopOBSMonitoring() {
	if (monitorInterval) {
		clearInterval(monitorInterval);
		monitorInterval = null;
		console.log('[OBS Monitor] OBS event monitoring stopped');
	}
}

/**
 * Poll OBS state for changes
 */
async function pollOBSState(moduleContext) {
	try {
		const obs = moduleContext?.obs;
		if (!obs) return;

		// Check current scene
		try {
			const scene = await obs.getCurrentScene?.();
			if (scene && scene !== stateCache.currentScene) {
				stateCache.currentScene = scene;
				broadcastWebSocketMessage({
					type: 'CurrentSceneChanged',
					scene
				});
			}
		} catch (err) {
			// Scene monitoring not available
		}

		// Check current profile
		try {
			const profile = await obs.getCurrentProfile?.();
			if (profile && profile !== stateCache.currentProfile) {
				stateCache.currentProfile = profile;
				broadcastWebSocketMessage({
					type: 'ProfileChanged',
					profile
				});
			}
		} catch (err) {
			// Profile monitoring not available
		}

		// Check current collection
		try {
			const collection = await obs.getCurrentCollection?.();
			if (collection && collection !== stateCache.currentCollection) {
				stateCache.currentCollection = collection;
				broadcastWebSocketMessage({
					type: 'SceneCollectionChanged',
					collection
				});
			}
		} catch (err) {
			// Collection monitoring not available
		}

		// Check stream/recording status
		try {
			const status = await obs.getStatus?.();
			const statusString = JSON.stringify(status);
			const cachedStatusString = JSON.stringify(stateCache.streamStatus);

			if (statusString !== cachedStatusString && status) {
				stateCache.streamStatus = status;
				broadcastWebSocketMessage({
					type: 'StreamStateChanged',
					streaming: status.streaming || false,
					recording: status.recording || false,
					recordingPaused: status.recordingPaused || false,
					replayBufferActive: status.replayBufferActive || false,
					virtualCameraActive: status.virtualCameraActive || false
				});
			}
		} catch (err) {
			// Status monitoring not available
		}

		// Check video settings
		try {
			const baseRes = await obs.getBaseResolution?.();
			const scaledRes = await obs.getScaledResolution?.();
			const fps = await obs.getFrameRate?.();
			const format = await obs.getFormat?.();

			const settings = {
				baseResolution: baseRes,
				scaledResolution: scaledRes,
				frameRate: fps,
				videoFormat: format
			};

			const settingsString = JSON.stringify(settings);
			const cachedSettingsString = JSON.stringify(stateCache.videoSettings);

			if (settingsString !== cachedSettingsString) {
				stateCache.videoSettings = settings;
				broadcastWebSocketMessage({
					type: 'VideoSettingsChanged',
					settings
				});
			}
		} catch (err) {
			// Video settings monitoring not available
		}

		// Check replay buffer state
		try {
			const active = await obs.getReplayBufferActive?.();
			const maxSeconds = await obs.getMaxReplayBufferSeconds?.();

			const rbState = {
				active: active || false,
				maxDurationSeconds: maxSeconds || 0
			};

			const rbStateString = JSON.stringify(rbState);
			const cachedRbStateString = JSON.stringify(stateCache.replayBufferState);

			if (rbStateString !== cachedRbStateString) {
				stateCache.replayBufferState = rbState;
				broadcastWebSocketMessage({
					type: 'ReplayBufferStateChanged',
					state: rbState
				});
			}
		} catch (err) {
			// Replay buffer monitoring not available
		}

		// Check virtual camera state
		try {
			const vcActive = await obs.getVirtualCameraActive?.();
			const vcFormat = await obs.getVirtualCameraFormat?.();

			const vcState = {
				active: vcActive || false,
				outputFormat: vcFormat || 'UYVY'
			};

			const vcStateString = JSON.stringify(vcState);
			const cachedVcStateString = JSON.stringify(stateCache.virtualCameraState);

			if (vcStateString !== cachedVcStateString) {
				stateCache.virtualCameraState = vcState;
				broadcastWebSocketMessage({
					type: 'VirtualCameraStateChanged',
					state: vcState
				});
			}
		} catch (err) {
			// Virtual camera monitoring not available
		}
	} catch (err) {
		console.error('[OBS Monitor] Poll error:', err);
	}
}

/**
 * Set up event listeners on OBS controller (if available)
 */
function setupEventListeners(moduleContext) {
	const obs = moduleContext.obs;

	try {
		// Scene change event
		if (obs.on && typeof obs.on === 'function') {
			obs.on('CurrentSceneChanged', (event) => {
				const scene = event.sceneName;
				stateCache.currentScene = scene;
				broadcastWebSocketMessage({
					type: 'CurrentSceneChanged',
					scene
				});
			});

			// Stream state change
			obs.on('StreamStateChanged', (event) => {
				const status = {
					streaming: event.outputActive || false,
					recording: event.recordingState || false,
					recordingPaused: false,
					replayBufferActive: false,
					virtualCameraActive: false
				};
				stateCache.streamStatus = status;
				broadcastWebSocketMessage({
					type: 'StreamStateChanged',
					...status
				});
			});

			// Recording state change
			obs.on('RecordStateChanged', (event) => {
				broadcastWebSocketMessage({
					type: 'StreamStateChanged',
					recording: event.recordingState || false,
					recordingPaused: event.recordingPaused || false
				});
			});

			console.log('[OBS Monitor] Event listeners registered');
		}
	} catch (err) {
		console.warn('[OBS Monitor] Could not register event listeners:', err);
	}
}

/**
 * Reset state cache
 */
export function resetStateCache() {
	stateCache = {
		currentScene: null,
		currentProfile: null,
		currentCollection: null,
		streamStatus: null,
		videoSettings: null,
		replayBufferState: null,
		virtualCameraState: null
	};
}

/**
 * Get current cached state
 */
export function getCachedState() {
	return { ...stateCache };
}
