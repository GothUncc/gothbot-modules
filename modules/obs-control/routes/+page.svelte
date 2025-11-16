<script>
	import { onMount, onDestroy } from 'svelte';
	import { connectionStatus } from './stores/obsStatus.js';
	import { initializeWebSocket } from './lib/websocket.js';

	// OBS State - NOW REAL DATA
	let scenes = [];
	let currentScene = '';
	let sources = [];
	let audioSources = [];
	
	let streaming = false;
	let recording = false;
	let virtualCam = false;
	let studioMode = false;
	let replayBuffer = false;
	
	let currentTransition = 'Fade';
	let transitionDuration = 300;
	
	let stats = { 
		cpu: 0, 
		fps: 0, 
		dropped: 0, 
		kbps: 0,
		renderTime: '0.0 ms',
		encodingTime: '0.0 ms'
	};

	let refreshInterval;
	let audioInterval;

	onMount(async () => {
		initializeWebSocket();
		
		// Load initial data
		await loadAllData();
		
		// Refresh every 2 seconds
		refreshInterval = setInterval(loadAllData, 2000);
		
		// Simulate audio levels (real levels would need WebSocket events)
		audioInterval = setInterval(() => {
			audioSources = audioSources.map(source => ({
				...source,
				peak: source.muted ? 0 : Math.random() * source.volume
			}));
		}, 100);
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
		if (audioInterval) clearInterval(audioInterval);
	});

	async function loadAllData() {
		try {
			await Promise.all([
				loadScenes(),
				loadSources(),
				loadAudioSources(),
				loadControls()
			]);
		} catch (error) {
			console.error('Failed to load OBS data:', error);
		}
	}

	async function loadScenes() {
		try {
			const response = await fetch('/api/obs/scenes');
			const data = await response.json();
			scenes = data.scenes.map(s => s.sceneName || s.name);
			currentScene = data.currentScene;
		} catch (error) {
			console.error('Failed to load scenes:', error);
		}
	}

	async function loadSources() {
		if (!currentScene) return;
		try {
			const response = await fetch(`/api/obs/sources?scene=${encodeURIComponent(currentScene)}`);
			const data = await response.json();
			sources = data.sources.map(s => ({
				name: s.sourceName,
				visible: s.sceneItemEnabled,
				locked: s.sceneItemLocked,
				type: s.sourceType || 'input',
				sceneItemId: s.sceneItemId
			}));
		} catch (error) {
			console.error('Failed to load sources:', error);
		}
	}

	async function loadAudioSources() {
		try {
			const response = await fetch('/api/obs/audio');
			const data = await response.json();
			audioSources = data.audioSources.map(s => ({
				...s,
				peak: s.muted ? 0 : s.volume
			}));
		} catch (error) {
			console.error('Failed to load audio sources:', error);
		}
	}

	async function loadControls() {
		try {
			const response = await fetch('/api/obs/controls');
			const data = await response.json();
			streaming = data.streaming;
			recording = data.recording;
			virtualCam = data.virtualCam;
			replayBuffer = data.replayBuffer;
			stats = data.stats;
		} catch (error) {
			console.error('Failed to load controls:', error);
		}
	}

	// Scene Management
	async function selectScene(scene) {
		try {
			await fetch('/api/obs/scenes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'setCurrentScene', sceneName: scene })
			});
			currentScene = scene;
			await loadSources();
		} catch (error) {
			console.error('Failed to set scene:', error);
			alert('Failed to switch scene: ' + error.message);
		}
	}

	async function addScene() {
		const newScene = prompt('Enter scene name:');
		if (!newScene) return;
		
		try {
			await fetch('/api/obs/scenes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'createScene', sceneName: newScene })
			});
			await loadScenes();
		} catch (error) {
			console.error('Failed to create scene:', error);
			alert('Failed to create scene: ' + error.message);
		}
	}

	async function removeScene() {
		if (scenes.length <= 1) {
			alert('Cannot remove the last scene');
			return;
		}
		const confirmed = confirm(`Remove scene "${currentScene}"?`);
		if (!confirmed) return;
		
		try {
			await fetch('/api/obs/scenes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'removeScene', sceneName: currentScene })
			});
			await loadScenes();
		} catch (error) {
			console.error('Failed to remove scene:', error);
			alert('Failed to remove scene: ' + error.message);
		}
	}

	// Source Management
	async function toggleSourceVisibility(index) {
		const source = sources[index];
		try {
			await fetch('/api/obs/sources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'setVisibility', 
					sceneName: currentScene, 
					sceneItemId: source.sceneItemId, 
					enabled: !source.visible 
				})
			});
			sources[index].visible = !source.visible;
			sources = sources;
		} catch (error) {
			console.error('Failed to toggle visibility:', error);
		}
	}

	async function toggleSourceLock(index) {
		const source = sources[index];
		try {
			await fetch('/api/obs/sources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'setLocked', 
					sceneName: currentScene, 
					sceneItemId: source.sceneItemId, 
					locked: !source.locked 
				})
			});
			sources[index].locked = !source.locked;
			sources = sources;
		} catch (error) {
			console.error('Failed to toggle lock:', error);
		}
	}

	// Audio Control
	async function toggleMute(index) {
		const source = audioSources[index];
		try {
			await fetch('/api/obs/audio', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'toggleMute', 
					inputName: source.name 
				})
			});
			audioSources[index].muted = !source.muted;
			audioSources = audioSources;
		} catch (error) {
			console.error('Failed to toggle mute:', error);
		}
	}

	async function updateVolume(index, event) {
		const volume = parseInt(event.target.value);
		const source = audioSources[index];
		try {
			await fetch('/api/obs/audio', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'setVolume', 
					inputName: source.name, 
					volume 
				})
			});
			audioSources[index].volume = volume;
			audioSources = audioSources;
		} catch (error) {
			console.error('Failed to set volume:', error);
		}
	}

	// Streaming & Recording
	async function toggleStreaming() {
		try {
			await fetch('/api/obs/controls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggleStreaming' })
			});
			await loadControls();
		} catch (error) {
			console.error('Failed to toggle streaming:', error);
			alert('Failed to toggle streaming: ' + error.message);
		}
	}

	async function toggleRecording() {
		try {
			await fetch('/api/obs/controls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggleRecording' })
			});
			await loadControls();
		} catch (error) {
			console.error('Failed to toggle recording:', error);
			alert('Failed to toggle recording: ' + error.message);
		}
	}

	async function toggleVirtualCam() {
		try {
			await fetch('/api/obs/controls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggleVirtualCam' })
			});
			await loadControls();
		} catch (error) {
			console.error('Failed to toggle virtual camera:', error);
			alert('Failed to toggle virtual camera: ' + error.message);
		}
	}

	async function toggleStudioMode() {
		try {
			// TODO: Implement studio mode API endpoint
			studioMode = !studioMode;
			alert('Studio mode not yet implemented');
		} catch (error) {
			console.error('Failed to toggle studio mode:', error);
		}
	}

	async function toggleReplayBuffer() {
		try {
			await fetch('/api/obs/controls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggleReplayBuffer' })
			});
			await loadControls();
		} catch (error) {
			console.error('Failed to toggle replay buffer:', error);
			alert('Failed to toggle replay buffer: ' + error.message);
		}
	}

	async function saveReplay() {
		if (!replayBuffer) {
			alert('Replay Buffer is not active');
			return;
		}
		try {
			await fetch('/api/obs/controls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'saveReplay' })
			});
			alert('Replay saved!');
		} catch (error) {
			console.error('Failed to save replay:', error);
			alert('Failed to save replay: ' + error.message);
		}
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
