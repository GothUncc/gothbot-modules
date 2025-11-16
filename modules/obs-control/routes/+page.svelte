<script>
	import { onMount, onDestroy } from 'svelte';
	import { connectionStatus } from './stores/obsStatus.js';
	import { initializeWebSocket } from './lib/websocket.js';

	// OBS State
	let scenes = ['Main Scene', 'BRB Screen', 'Ending Screen'];
	let currentScene = 'Main Scene';
	let sources = [
		{ name: 'Webcam', visible: true, locked: false, type: 'input' },
		{ name: 'Desktop Audio', visible: true, locked: false, type: 'input' },
		{ name: 'GothBot Overlay', visible: true, locked: false, type: 'browser' },
		{ name: 'Game Capture', visible: false, locked: false, type: 'game' }
	];
	let audioSources = [
		{ name: 'Desktop Audio', volume: 75, muted: false, monitoring: 'none', peak: 0, channels: 2 },
		{ name: 'Microphone', volume: 90, muted: false, monitoring: 'monitor_only', peak: 0, channels: 1 },
		{ name: 'Music', volume: 60, muted: true, monitoring: 'none', peak: 0, channels: 2 }
	];
	
	let streaming = false;
	let recording = false;
	let virtualCam = false;
	let studioMode = false;
	let replayBuffer = false;
	
	let currentTransition = 'Fade';
	let transitionDuration = 300;
	
	let stats = { 
		cpu: 1.3, 
		fps: 60.00, 
		dropped: 0, 
		kbps: 0,
		renderTime: '0.0 ms',
		encodingTime: '0.0 ms'
	};

	// Simulate audio level updates
	let audioInterval;

	onMount(() => {
		initializeWebSocket();
		
		// Simulate audio levels
		audioInterval = setInterval(() => {
			audioSources = audioSources.map(source => ({
				...source,
				peak: source.muted ? 0 : Math.random() * source.volume
			}));
		}, 100);
		
		// TODO: Load actual OBS state from API
		// TODO: Subscribe to OBS events
	});

	onDestroy(() => {
		if (audioInterval) clearInterval(audioInterval);
	});

	// Scene Management
	function selectScene(scene) {
		currentScene = scene;
		// TODO: Call context.obs.call('SetCurrentProgramScene', { sceneName: scene })
	}

	function addScene() {
		const newScene = prompt('Enter scene name:');
		if (newScene && !scenes.includes(newScene)) {
			scenes = [...scenes, newScene];
			// TODO: Call context.obs.call('CreateScene', { sceneName: newScene })
		}
	}

	function removeScene() {
		if (scenes.length <= 1) {
			alert('Cannot remove the last scene');
			return;
		}
		const confirmed = confirm(`Remove scene "${currentScene}"?`);
		if (confirmed) {
			scenes = scenes.filter(s => s !== currentScene);
			currentScene = scenes[0];
			// TODO: Call context.obs.call('RemoveScene', { sceneName: currentScene })
		}
	}

	// Source Management
	function toggleSourceVisibility(index) {
		sources[index].visible = !sources[index].visible;
		sources = sources;
		// TODO: Call context.obs.call('SetSceneItemEnabled', { sceneName: currentScene, sceneItemId: index, sceneItemEnabled: sources[index].visible })
	}

	function toggleSourceLock(index) {
		sources[index].locked = !sources[index].locked;
		sources = sources;
		// TODO: Call context.obs.call('SetSceneItemLocked', { sceneName: currentScene, sceneItemId: index, sceneItemLocked: sources[index].locked })
	}

	// Audio Control
	function toggleMute(index) {
		audioSources[index].muted = !audioSources[index].muted;
		audioSources = audioSources;
		// TODO: Call context.obs.call('SetInputMute', { inputName: audioSources[index].name, inputMuted: audioSources[index].muted })
	}

	function updateVolume(index, event) {
		const volume = parseInt(event.target.value);
		audioSources[index].volume = volume;
		audioSources = audioSources;
		// TODO: Call context.obs.call('SetInputVolume', { inputName: audioSources[index].name, inputVolumeDb: volumeToDb(volume) })
	}

	function volumeToDb(percent) {
		if (percent === 0) return -100;
		return 20 * Math.log10(percent / 100);
	}

	// Streaming & Recording
	async function toggleStreaming() {
		streaming = !streaming;
		// TODO: Call context.obs.call(streaming ? 'StartStream' : 'StopStream')
	}

	async function toggleRecording() {
		recording = !recording;
		// TODO: Call context.obs.call(recording ? 'StartRecord' : 'StopRecord')
	}

	async function toggleVirtualCam() {
		virtualCam = !virtualCam;
		// TODO: Call context.obs.call(virtualCam ? 'StartVirtualCam' : 'StopVirtualCam')
	}

	async function toggleStudioMode() {
		studioMode = !studioMode;
		// TODO: Call context.obs.call('SetStudioModeEnabled', { studioModeEnabled: studioMode })
	}

	async function toggleReplayBuffer() {
		replayBuffer = !replayBuffer;
		// TODO: Call context.obs.call(replayBuffer ? 'StartReplayBuffer' : 'StopReplayBuffer')
	}

	async function saveReplay() {
		if (!replayBuffer) {
			alert('Replay Buffer is not active');
			return;
		}
		// TODO: Call context.obs.call('SaveReplayBuffer')
		alert('Replay saved!');
	}
</script>

<!-- OBS Studio Layout -->
<div class="obs-layout">
	<!-- Top Menu Bar -->
	<div class="menu-bar">
		<div class="menu-items">
			<button class="menu-btn">File</button>
			<button class="menu-btn">View</button>
			<button class="menu-btn">Tools</button>
			<button class="menu-btn">Help</button>
		</div>
		<div class="menu-right">
			<div class="status-badge" class:connected={$connectionStatus === 'connected'}>
				<span class="dot"></span>
				{$connectionStatus === 'connected' ? 'Connected' : 'Offline'}
			</div>
			<a href="/modules" class="back-btn">← Back to Core</a>
		</div>
	</div>

	<!-- Main Content -->
	<div class="main-content">
		<!-- Left Panel: Scenes -->
		<div class="panel scenes-panel">
			<div class="panel-header">
				<span class="panel-title">Scenes</span>
				<div class="panel-controls">
					<button class="icon-btn" title="Add Scene" on:click={addScene}>+</button>
					<button class="icon-btn" title="Remove Scene" on:click={removeScene}>−</button>
					<button class="icon-btn" title="Move Up">↑</button>
					<button class="icon-btn" title="Move Down">↓</button>
				</div>
			</div>
			<div class="panel-content">
				{#each scenes as scene}
					<button 
						class="list-item" 
						class:active={scene === currentScene}
						on:click={() => selectScene(scene)}
					>
						<span class="scene-icon">🎬</span>
						{scene}
					</button>
				{/each}
			</div>
		</div>

		<!-- Center: Preview/Canvas -->
		<div class="preview-container">
			<div class="preview-canvas">
				<div class="preview-placeholder">
					<div class="preview-info">
						<div class="preview-scene">
							<span class="scene-badge">🎬</span>
							{currentScene}
						</div>
						<div class="preview-status">
							{#if streaming}<span class="status-live">🔴 LIVE</span>{/if}
							{#if recording}<span class="status-rec">⏺️ REC</span>{/if}
							{#if virtualCam}<span class="status-vcam">📷 VCAM</span>{/if}
						</div>
						<div class="preview-stats">
							<div class="stat-item">
								<span class="stat-label">CPU:</span>
								<span class="stat-value">{stats.cpu}%</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">FPS:</span>
								<span class="stat-value">{stats.fps.toFixed(2)}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Render:</span>
								<span class="stat-value">{stats.renderTime}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Dropped:</span>
								<span class="stat-value">{stats.dropped}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Panel: Sources -->
		<div class="panel sources-panel">
			<div class="panel-header">
				<span class="panel-title">Sources</span>
				<div class="panel-controls">
					<button class="icon-btn" title="Add Source">+</button>
					<button class="icon-btn" title="Remove Source">−</button>
					<button class="icon-btn" title="Move Up">↑</button>
					<button class="icon-btn" title="Move Down">↓</button>
				</div>
			</div>
			<div class="panel-content">
				{#each sources as source, i}
					<div class="list-item source-item">
						<button 
							class="source-icon-btn" 
							class:hidden={!source.visible}
							on:click={() => toggleSourceVisibility(i)}
							title={source.visible ? 'Hide' : 'Show'}
						>
							{source.visible ? '👁️' : '🚫'}
						</button>
						<button 
							class="source-icon-btn"
							class:locked={source.locked}
							on:click={() => toggleSourceLock(i)}
							title={source.locked ? 'Unlock' : 'Lock'}
						>
							{source.locked ? '🔒' : '🔓'}
						</button>
						<span class="source-name">{source.name}</span>
						<span class="source-type">{source.type}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="bottom-section">
		<!-- Audio Mixer -->
		<div class="audio-mixer">
			<div class="mixer-header">
				<span class="panel-title">Audio Mixer</span>
			</div>
			<div class="mixer-channels">
				{#each audioSources as audio, i}
					<div class="mixer-channel">
						<div class="channel-label" title={audio.name}>{audio.name}</div>
						<div class="channel-meter">
							<div class="meter-bar">
								<div class="meter-fill" style="--peak-height: {audio.peak}%"></div>
							</div>
						</div>
						<div class="channel-controls">
							<input 
								type="range" 
								min="0" 
								max="100" 
								value={audio.volume}
								on:input={(e) => updateVolume(i, e)}
								class="volume-slider"
								orient="vertical"
							/>
							<button 
								class="mute-btn"
								class:muted={audio.muted}
								on:click={() => toggleMute(i)}
								title={audio.muted ? 'Unmute' : 'Mute'}
							>
								{audio.muted ? '🔇' : '🔊'}
							</button>
							<span class="volume-value">{audio.volume}%</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Scene Transitions -->
		<div class="transitions-panel">
			<div class="panel-title">Scene Transitions</div>
			<div class="transition-controls">
				<select class="transition-select" bind:value={currentTransition}>
					<option>Fade</option>
					<option>Cut</option>
					<option>Stinger</option>
					<option>Fade to Color</option>
				</select>
				<label class="duration-label">
					Duration:
					<input 
						type="number" 
						bind:value={transitionDuration}
						min="50"
						max="2000"
						step="50"
						class="duration-input"
					/> ms
				</label>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls-panel">
			<button 
				class="control-btn streaming"
				class:active={streaming}
				on:click={toggleStreaming}
			>
				{streaming ? '🔴 Stop Streaming' : '⚫ Start Streaming'}
			</button>
			<button 
				class="control-btn recording"
				class:active={recording}
				on:click={toggleRecording}
			>
				{recording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
			</button>
			<button 
				class="control-btn virtual-cam"
				class:active={virtualCam}
				on:click={toggleVirtualCam}
			>
				📷 Virtual Camera
			</button>
			<button 
				class="control-btn studio-mode"
				class:active={studioMode}
				on:click={toggleStudioMode}
			>
				🎬 Studio Mode
			</button>
			<button 
				class="control-btn replay-buffer"
				class:active={replayBuffer}
				on:click={toggleReplayBuffer}
			>
				💾 Replay Buffer
			</button>
			<button 
				class="control-btn save-replay"
				on:click={saveReplay}
				disabled={!replayBuffer}
			>
				💿 Save Replay
			</button>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
		background: #1a1a24;
		color: #efeff1;
		overflow: hidden;
	}

	/* OBS Layout Structure */
	.obs-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		background: #1a1a24;
	}

	/* Top Menu Bar */
	.menu-bar {
		height: 36px;
		background: #13131a;
		border-bottom: 1px solid #2a2a3a;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8px;
		flex-shrink: 0;
	}

	.menu-items {
		display: flex;
		gap: 4px;
	}

	.menu-btn {
		padding: 4px 12px;
		background: transparent;
		border: none;
		color: #adadb8;
		font-size: 13px;
		cursor: pointer;
		border-radius: 3px;
		transition: all 0.15s;
	}

	.menu-btn:hover {
		background: #1f1f2e;
		color: #efeff1;
	}

	.menu-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		background: #1f1f2e;
		border-radius: 4px;
		font-size: 12px;
		color: #adadb8;
		font-weight: 500;
	}

	.status-badge.connected {
		color: #00f593;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e91916;
	}

	.status-badge.connected .dot {
		background: #00f593;
	}

	.back-btn {
		padding: 4px 10px;
		background: #9147ff;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.15s;
	}

	.back-btn:hover {
		background: #7c3aed;
	}

	/* Main Content Area */
	.main-content {
		flex: 1;
		display: grid;
		grid-template-columns: 200px 1fr 200px;
		gap: 4px;
		padding: 4px;
		overflow: hidden;
	}

	/* Panels */
	.panel {
		background: #1f1f2e;
		border: 1px solid #2a2a3a;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-header {
		padding: 8px;
		background: #13131a;
		border-bottom: 1px solid #2a2a3a;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.panel-title {
		font-size: 12px;
		font-weight: 600;
		color: #efeff1;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.panel-controls {
		display: flex;
		gap: 2px;
	}

	.icon-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: #adadb8;
		font-size: 16px;
		cursor: pointer;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.icon-btn:hover {
		background: #2a2a3a;
		color: #efeff1;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 4px;
	}

	/* List Items */
	.list-item {
		width: 100%;
		padding: 8px;
		background: transparent;
		border: none;
		color: #adadb8;
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		border-radius: 3px;
		margin-bottom: 2px;
		transition: all 0.15s;
	}

	.list-item:hover {
		background: #2a2a3a;
		color: #efeff1;
	}

	.list-item.active {
		background: #9147ff;
		color: white;
		font-weight: 500;
	}

	.source-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
	}

	.source-icon-btn {
		padding: 2px 4px;
		background: transparent;
		border: none;
		font-size: 14px;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.15s;
	}

	.source-icon-btn:hover {
		opacity: 1;
	}

	.source-icon-btn.hidden {
		opacity: 0.3;
	}

	.source-icon-btn.locked {
		color: #ff4444;
		opacity: 1;
	}

	.source-name {
		flex: 1;
		font-size: 13px;
	}

	.source-type {
		font-size: 10px;
		color: #9147ff;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.scene-icon {
		margin-right: 6px;
	}

	/* Preview Canvas */
	.preview-container {
		display: flex;
		flex-direction: column;
	}

	.preview-canvas {
		flex: 1;
		background: #13131a;
		border: 1px solid #2a2a3a;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		aspect-ratio: 16 / 9;
		max-height: 100%;
	}

	.preview-placeholder {
		text-align: center;
	}

	.preview-info {
		padding: 20px;
	}

	.preview-scene {
		font-size: 24px;
		font-weight: 600;
		color: #efeff1;
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.scene-badge {
		font-size: 28px;
	}

	.preview-status {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.status-live,
	.status-rec,
	.status-vcam {
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 1px;
	}

	.status-live {
		background: #e91916;
		color: white;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.status-rec {
		background: #ff4444;
		color: white;
	}

	.status-vcam {
		background: #9147ff;
		color: white;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.preview-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.stat-item {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
	}

	.stat-label {
		color: #adadb8;
		font-weight: 500;
	}

	.stat-value {
		color: #00f593;
		font-weight: 600;
		font-family: 'Courier New', monospace;
	}

	/* Bottom Section */
	.bottom-section {
		height: 220px;
		background: #1f1f2e;
		border-top: 1px solid #2a2a3a;
		display: grid;
		grid-template-columns: 1fr 250px 250px;
		gap: 4px;
		padding: 4px;
		flex-shrink: 0;
	}

	/* Audio Mixer */
	.audio-mixer {
		background: #13131a;
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.mixer-header {
		padding: 8px;
		border-bottom: 1px solid #2a2a3a;
	}

	.mixer-channels {
		flex: 1;
		display: flex;
		gap: 8px;
		padding: 12px;
		overflow-x: auto;
	}

	.mixer-channel {
		min-width: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.channel-label {
		font-size: 11px;
		color: #adadb8;
		text-align: center;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.channel-meter {
		flex: 1;
		width: 100%;
		display: flex;
		align-items: flex-end;
	}

	.meter-bar {
		width: 100%;
		height: 120px;
		background: #2a2a3a;
		border-radius: 3px;
		overflow: hidden;
		position: relative;
	}

	.meter-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--peak-height, 0%);
		background: linear-gradient(to top, #00f593 0%, #00f593 70%, #ffd000 70%, #ffd000 85%, #ff4444 85%);
		transition: height 0.05s ease-out;
	}

	.channel-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.mute-btn {
		padding: 6px;
		background: #2a2a3a;
		border: none;
		border-radius: 3px;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mute-btn:hover {
		background: #3a3a4a;
	}

	.mute-btn.muted {
		background: #e91916;
	}

	.volume-value {
		font-size: 11px;
		color: #adadb8;
	}

	.volume-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 60px;
		height: 4px;
		background: #2a2a3a;
		outline: none;
		border-radius: 2px;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		background: #9147ff;
		cursor: pointer;
		border-radius: 50%;
	}

	.volume-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		background: #9147ff;
		cursor: pointer;
		border-radius: 50%;
		border: none;
	}

	/* Transitions Panel */
	.transitions-panel {
		background: #13131a;
		border-radius: 4px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.transition-controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.transition-select {
		padding: 6px 8px;
		background: #2a2a3a;
		border: 1px solid #3a3a4a;
		border-radius: 4px;
		color: #efeff1;
		font-size: 13px;
	}

	.duration-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #adadb8;
	}

	.duration-input {
		width: 70px;
		padding: 4px 6px;
		background: #2a2a3a;
		border: 1px solid #3a3a4a;
		border-radius: 4px;
		color: #efeff1;
		font-size: 12px;
	}

	/* Controls Panel */
	.controls-panel {
		background: #13131a;
		border-radius: 4px;
		padding: 8px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	.control-btn {
		padding: 10px;
		background: #2a2a3a;
		border: none;
		border-radius: 4px;
		color: #adadb8;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.control-btn:hover {
		background: #3a3a4a;
		color: #efeff1;
	}

	.control-btn.streaming.active {
		background: #e91916;
		color: white;
	}

	.control-btn.recording.active {
		background: #e91916;
		color: white;
	}

	.control-btn.virtual-cam.active,
	.control-btn.studio-mode.active,
	.control-btn.replay-buffer.active {
		background: #9147ff;
		color: white;
	}

	.control-btn.save-replay:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Scrollbar Styling */
	::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	::-webkit-scrollbar-track {
		background: #1a1a24;
	}

	::-webkit-scrollbar-thumb {
		background: #2a2a3a;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #3a3a4a;
	}
</style>
