import { writable, derived } from 'svelte/store';

// Core connection state
export const connectionStatus = writable('disconnected');
export const lastUpdate = writable(null);
export const uptime = writable('00:00:00');

// OBS Server info
export const obsInfo = writable({
	version: null,
	obsVersion: null,
	webSocketVersion: null,
	rpcVersion: null,
	platform: null,
	platformVersion: null
});

// Current state
export const currentScene = writable(null);
export const currentProfile = writable(null);
export const currentCollection = writable(null);

// Stream/Recording state
export const streamStatus = writable({
	streaming: false,
	recording: false,
	recordingPaused: false,
	replayBufferActive: false,
	virtualCameraActive: false
});

// Video settings
export const videoSettings = writable({
	baseResolution: { width: 1920, height: 1080 },
	scaledResolution: { width: 1920, height: 1080 },
	frameRate: 60,
	videoFormat: 'I420'
});

// Replay buffer state
export const replayBufferState = writable({
	active: false,
	maxDurationSeconds: 300,
	savedClips: 0,
	lastSaveTime: null
});

// Virtual camera state
export const virtualCameraState = writable({
	active: false,
	outputFormat: 'UYVY'
});

// Audio mixer
export const audioMixer = writable({
	masterVolume: 0,
	tracks: []
});

// Scenes and sources
export const scenes = writable([]);
export const sources = writable({});

// Profiles and Collections
export const profiles = writable([]);
export const collections = writable([]);

// Error and loading states
export const error = writable(null);
export const loading = writable(false);

// Derived stores
export const isConnected = derived(connectionStatus, $status => $status === 'connected');

export const dashboardStats = derived(
	[connectionStatus, streamStatus, replayBufferState, virtualCameraState],
	([$status, $stream, $replay, $virtualCam]) => ({
		connected: $status === 'connected',
		streaming: $stream.streaming,
		recording: $stream.recording,
		replayBufferActive: $replay.active,
		virtualCameraActive: $virtualCam.active,
		savedClips: $replay.savedClips
	})
);

// Functions to update state
export function updateConnectionStatus(status) {
	connectionStatus.set(status);
	if (status === 'connected') {
		lastUpdate.set(new Date().toLocaleTimeString());
	}
}

export function updateStreamStatus(status) {
	streamStatus.set(status);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateCurrentScene(scene) {
	currentScene.set(scene);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateCurrentProfile(profile) {
	currentProfile.set(profile);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateCurrentCollection(collection) {
	currentCollection.set(collection);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateVideoSettings(settings) {
	videoSettings.set(settings);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateReplayBufferState(state) {
	replayBufferState.set(state);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function updateVirtualCameraState(state) {
	virtualCameraState.set(state);
	lastUpdate.set(new Date().toLocaleTimeString());
}

export function setError(errorMessage) {
	error.set(errorMessage);
	setTimeout(() => error.set(null), 5000);
}

export function clearError() {
	error.set(null);
}
