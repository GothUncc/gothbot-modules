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
	const wsUrl = `${protocol}//${window.location.host}/api/obs/websocket`;

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

			case 'CurrentSceneChanged':
				updateCurrentScene(message.scene);
				break;

			case 'StreamStateChanged':
				updateStreamStatus({
					streaming: message.streaming,
					recording: message.recording,
					recordingPaused: message.recordingPaused,
					replayBufferActive: message.replayBufferActive,
					virtualCameraActive: message.virtualCameraActive
				});
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

			case 'ReplayBufferStateChanged':
				updateReplayBufferState(message.state);
				break;

			case 'VirtualCameraStateChanged':
				updateVirtualCameraState(message.state);
				break;

			case 'Error':
				setError(message.errorMessage || 'An error occurred');
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
