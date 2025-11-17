import {
	updateConnectionStatus,
	updateStreamStatus,
	updateCurrentScene,
	updateCurrentProfile,
	updateCurrentCollection,
	updateVideoSettings,
	updateReplayBufferState,
	updateVirtualCameraState,
	setError
} from '../stores/obsStatus.js';

let socket = null;
const reconnectDelay = 3000;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

export function initializeWebSocket() {
	if (socket && socket.readyState === WebSocket.OPEN) {
		return;
	}

	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	// Use relative path to work with module-ui URL pattern
	const wsUrl = `${protocol}//${window.location.host}${window.location.pathname}ws`.replace(/\/+$/, '/ws');

	try {
		socket = new WebSocket(wsUrl);

		socket.addEventListener('open', handleWebSocketOpen);
		socket.addEventListener('message', handleWebSocketMessage);
		socket.addEventListener('error', handleWebSocketError);
		socket.addEventListener('close', handleWebSocketClose);
	} catch (err) {
		setError(`WebSocket connection failed: ${err.message}`);
		scheduleReconnect();
	}
}

function handleWebSocketOpen() {
	console.log('[OBS WebSocket] Connected');
	updateConnectionStatus('connected');
	reconnectAttempts = 0;

	// Request initial state
	socket.send(
		JSON.stringify({
			type: 'request',
			action: 'getServerStatus'
		})
	);
}

function handleWebSocketMessage(event) {
	try {
		const message = JSON.parse(event.data);

		switch (message.type) {
			case 'ServerStatus':
				handleServerStatus(message);
				break;

			// Scene events
			case 'CurrentProgramSceneChanged':
				if (message.data && message.data.sceneName) {
					updateCurrentScene(message.data.sceneName);
					// Trigger scene reload for scene items
					window.dispatchEvent(new CustomEvent('obs-scene-changed', { detail: message.data }));
				}
				break;

			case 'SceneCreated':
			case 'SceneRemoved':
			case 'SceneNameChanged':
				// Trigger full scene list reload
				window.dispatchEvent(new CustomEvent('obs-scenes-changed', { detail: message.data }));
				break;

			// Scene item events
			case 'SceneItemCreated':
			case 'SceneItemRemoved':
			case 'SceneItemEnableStateChanged':
			case 'SceneItemTransformChanged':
				// Trigger scene items reload for affected scene
				window.dispatchEvent(new CustomEvent('obs-scene-items-changed', { detail: message.data }));
				break;

			// Input/Source events
			case 'InputCreated':
			case 'InputRemoved':
			case 'InputNameChanged':
				// Trigger full sources reload
				window.dispatchEvent(new CustomEvent('obs-sources-changed', { detail: message.data }));
				break;

			case 'InputVolumeChanged':
			case 'InputMuteStateChanged':
			case 'InputAudioSyncOffsetChanged':
			case 'InputAudioTracksChanged':
			case 'InputAudioMonitorTypeChanged':
				// Trigger audio sources reload
				window.dispatchEvent(new CustomEvent('obs-audio-changed', { detail: message.data }));
				break;

			// Stream/Record events
			case 'StreamStateChanged':
				if (message.data) {
					updateStreamStatus({
						streaming: message.data.outputActive || false,
						recording: false // Will be updated by RecordStateChanged
					});
					window.dispatchEvent(new CustomEvent('obs-controls-changed'));
				}
				break;

			case 'RecordStateChanged':
				if (message.data) {
					window.dispatchEvent(new CustomEvent('obs-controls-changed'));
				}
				break;

			case 'ReplayBufferStateChanged':
				if (message.data) {
					updateReplayBufferState(message.data.outputActive || false);
					window.dispatchEvent(new CustomEvent('obs-controls-changed'));
				}
				break;

			case 'VirtualcamStateChanged':
				if (message.data) {
					updateVirtualCameraState(message.data.outputActive || false);
					window.dispatchEvent(new CustomEvent('obs-controls-changed'));
				}
				break;

			// Transition events
			case 'CurrentSceneTransitionChanged':
			case 'CurrentSceneTransitionDurationChanged':
				window.dispatchEvent(new CustomEvent('obs-transitions-changed', { detail: message.data }));
				break;

			// Profile/Collection events
			case 'CurrentProfileChanged':
				if (message.data && message.data.profileName) {
					updateCurrentProfile(message.data.profileName);
				}
				break;

			case 'CurrentSceneCollectionChanged':
				if (message.data && message.data.sceneCollectionName) {
					updateCurrentCollection(message.data.sceneCollectionName);
				}
				break;

			// Legacy events (keep for compatibility)
			case 'CurrentSceneChanged':
				updateCurrentScene(message.scene);
				break;

			case 'ProfileChanged':
				updateCurrentProfile(message.profile);
				break;

			case 'SceneCollectionChanged':
				updateCurrentCollection(message.collection);
				break;

			case 'VideoSettingsChanged':
				updateVideoSettings(message.settings);
				break;

			case 'Error':
				setError(message.errorMessage || 'An error occurred');
				break;

			case 'Success':
				console.log('[OBS WebSocket] Success:', message.message);
				break;

			default:
				console.log('[OBS WebSocket] Unknown message type:', message.type);
		}
	} catch (err) {
		console.error('[OBS WebSocket] Message parse error:', err);
	}
}

function handleWebSocketError(error) {
	console.error('[OBS WebSocket] Error:', error);
	setError('WebSocket error occurred');
}

function handleWebSocketClose() {
	console.log('[OBS WebSocket] Disconnected');
	updateConnectionStatus('disconnected');
	scheduleReconnect();
}

function handleServerStatus(message) {
	updateConnectionStatus('connected');
	// Process server status message
	console.log('[OBS WebSocket] Server status received');
}

function scheduleReconnect() {
	if (reconnectAttempts < maxReconnectAttempts) {
		reconnectAttempts++;
		console.log(`[OBS WebSocket] Attempting reconnect in ${reconnectDelay}ms (attempt ${reconnectAttempts})`);
		setTimeout(() => {
			initializeWebSocket();
		}, reconnectDelay);
	} else {
		setError('WebSocket reconnection failed after maximum attempts');
	}
}

export function sendWebSocketMessage(type, data) {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(
			JSON.stringify({
				type,
				...data
			})
		);
	} else {
		setError('WebSocket is not connected');
	}
}

export function disconnectWebSocket() {
	if (socket) {
		socket.close();
		socket = null;
		updateConnectionStatus('disconnected');
	}
}
