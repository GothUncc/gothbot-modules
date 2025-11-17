<script>
	import { onMount, onDestroy } from 'svelte';
	import { connectionStatus } from './stores/obsStatus.js';
	import { initializeWebSocket } from './lib/websocket.js';

	// Core v2.0.214: Final routing decision - all module routes under /modules/
	// SPA fallback properly handles both SvelteKit admin pages and module dashboards
	const API_PREFIX = '/modules/obs-master-control';

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
	let availableTransitions = [];
	
	let stats = { 
		cpu: 0, 
		fps: 0, 
		dropped: 0, 
		kbps: 0,
		renderTime: '0.0 ms',
		encodingTime: '0.0 ms'
	};

	// Selected source for advanced controls
	let selectedSource = null;
	let sourceFilters = [];
	let sourceTransform = null;
	
	// UI panels visibility
	let showFiltersPanel = false;
	let showTransformPanel = false;
	let showTextEditor = false;
	let showScreenshotPanel = false;

	let refreshInterval;

	onMount(async () => {
		initializeWebSocket();
		
		// Load initial data
		await loadAllData();
		
		// Refresh every 2 seconds
		refreshInterval = setInterval(loadAllData, 2000);
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});

	async function loadAllData() {
		try {
			// Load scenes first to get currentScene, then load sources
			await loadScenes();
			await Promise.all([
				loadSources(),
				loadAudioSources(),
				loadControls(),
				loadTransitions()
			]);
		} catch (error) {
			console.error('Failed to load OBS data:', error);
		}
	}

	async function loadScenes() {
		try {
			const response = await fetch(`${API_PREFIX}/api/obs/scenes`);
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
			const response = await fetch(`${API_PREFIX}/api/obs/sources?scene=${encodeURIComponent(currentScene)}`);
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
			const response = await fetch(`${API_PREFIX}/api/obs/audio`);
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
			const response = await fetch(`${API_PREFIX}/api/obs/controls`);
			const data = await response.json();
			streaming = data.streaming;
			recording = data.recording;
			virtualCam = data.virtualCam;
			replayBuffer = data.replayBuffer;
			studioMode = data.studioMode;
			stats = data.stats;
		} catch (error) {
			console.error('Failed to load controls:', error);
		}
	}

	async function loadTransitions() {
		try {
			const response = await fetch(`${API_PREFIX}/api/obs/transitions`);
			const data = await response.json();
			availableTransitions = data.transitions || [];
			currentTransition = data.currentTransition || 'Fade';
			transitionDuration = data.currentDuration || 300;
		} catch (error) {
			console.error('Failed to load transitions:', error);
		}
	}

	// Scene Management
	async function selectScene(scene) {
		try {
			await fetch(`${API_PREFIX}/api/obs/scenes`, {
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
			await fetch(`${API_PREFIX}/api/obs/scenes`, {
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
			await fetch(`${API_PREFIX}/api/obs/scenes`, {
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
			await fetch(`${API_PREFIX}/api/obs/sources`, {
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
			await fetch(`${API_PREFIX}/api/obs/sources`, {
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
			await fetch(`${API_PREFIX}/api/obs/audio`, {
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
			await fetch(`${API_PREFIX}/api/obs/audio`, {
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
			await fetch(`${API_PREFIX}/api/obs/controls`, {
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
			await fetch(`${API_PREFIX}/api/obs/controls`, {
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
			await fetch(`${API_PREFIX}/api/obs/controls`, {
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
			await fetch(`${API_PREFIX}/api/obs/controls`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'toggleStudioMode' })
			});
			await loadControls();
		} catch (error) {
			console.error('Failed to toggle studio mode:', error);
			alert('Failed to toggle studio mode: ' + error.message);
		}
	}

	async function toggleReplayBuffer() {
		try {
			await fetch(`${API_PREFIX}/api/obs/controls`, {
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
			await fetch(`${API_PREFIX}/api/obs/controls`, {
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

	// Transitions
	async function setTransition(transitionName) {
		try {
			await fetch(`${API_PREFIX}/api/obs/transitions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'setTransition', transitionName })
			});
			currentTransition = transitionName;
		} catch (error) {
			console.error('Failed to set transition:', error);
			alert('Failed to set transition: ' + error.message);
		}
	}

	async function setTransitionDuration() {
		try {
			await fetch(`${API_PREFIX}/api/obs/transitions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'setDuration', duration: transitionDuration })
			});
		} catch (error) {
			console.error('Failed to set transition duration:', error);
		}
	}

	// Source Selection & Filters
	async function selectSource(source) {
		selectedSource = source;
		showFiltersPanel = true;
		showTransformPanel = false;
		showTextEditor = false;
		showScreenshotPanel = false;
		await loadFilters(source.name);
	}

	async function loadFilters(sourceName) {
		try {
			const response = await fetch(`${API_PREFIX}/api/obs/filters?sourceName=${encodeURIComponent(sourceName)}`);
			const data = await response.json();
			sourceFilters = data.filters || [];
		} catch (error) {
			console.error('Failed to load filters:', error);
		}
	}

	async function addFilter() {
		if (!selectedSource) return;
		const filterName = prompt('Enter filter name:');
		if (!filterName) return;
		
		const filterKind = prompt('Enter filter kind (e.g., color_filter, mask_filter, gain_filter):');
		if (!filterKind) return;
		
		try {
			await fetch(`${API_PREFIX}/api/obs/filters`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'create', 
					sourceName: selectedSource.name, 
					filterName, 
					filterKind 
				})
			});
			await loadFilters(selectedSource.name);
		} catch (error) {
			console.error('Failed to add filter:', error);
			alert('Failed to add filter: ' + error.message);
		}
	}

	async function removeFilter(filterName) {
		if (!selectedSource) return;
		const confirmed = confirm(`Remove filter "${filterName}"?`);
		if (!confirmed) return;
		
		try {
			await fetch(`${API_PREFIX}/api/obs/filters`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'remove', 
					sourceName: selectedSource.name, 
					filterName 
				})
			});
			await loadFilters(selectedSource.name);
		} catch (error) {
			console.error('Failed to remove filter:', error);
			alert('Failed to remove filter: ' + error.message);
		}
	}

	async function toggleFilter(filterName, enabled) {
		if (!selectedSource) return;
		try {
			await fetch(`${API_PREFIX}/api/obs/filters`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'setEnabled', 
					sourceName: selectedSource.name, 
					filterName, 
					enabled 
				})
			});
		} catch (error) {
			console.error('Failed to toggle filter:', error);
		}
	}

	// Transform Controls
	async function showTransformControls(source) {
		selectedSource = source;
		showTransformPanel = true;
		showFiltersPanel = false;
		showTextEditor = false;
		showScreenshotPanel = false;
		await loadTransform(source);
	}

	async function loadTransform(source) {
		try {
			const response = await fetch(`${API_PREFIX}/api/obs/transforms?sceneName=${encodeURIComponent(currentScene)}&sceneItemId=${source.sceneItemId}`);
			const data = await response.json();
			sourceTransform = data.transform || {};
		} catch (error) {
			console.error('Failed to load transform:', error);
		}
	}

	async function updateTransform() {
		if (!selectedSource || !sourceTransform) return;
		try {
			await fetch(`${API_PREFIX}/api/obs/transforms`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					sceneName: currentScene, 
					sceneItemId: selectedSource.sceneItemId, 
					transform: sourceTransform 
				})
			});
			alert('Transform updated!');
		} catch (error) {
			console.error('Failed to update transform:', error);
			alert('Failed to update transform: ' + error.message);
		}
	}

	// Screenshot
	async function showScreenshotControls(source) {
		selectedSource = source;
		showScreenshotPanel = true;
		showFiltersPanel = false;
		showTransformPanel = false;
		showTextEditor = false;
	}

	async function takeScreenshot() {
		if (!selectedSource) return;
		const filePath = prompt('Enter save path (e.g., C:/screenshots/capture.png):');
		if (!filePath) return;
		
		try {
			await fetch(`${API_PREFIX}/api/obs/screenshots`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'save', 
					sourceName: selectedSource.name, 
					imageFilePath: filePath, 
					imageFormat: 'png' 
				})
			});
			alert(`Screenshot saved to ${filePath}`);
		} catch (error) {
			console.error('Failed to take screenshot:', error);
			alert('Failed to take screenshot: ' + error.message);
		}
	}

	// Text Source Editing
	async function showTextEdit(source) {
		selectedSource = source;
		showTextEditor = true;
		showFiltersPanel = false;
		showTransformPanel = false;
		showScreenshotPanel = false;
		await loadInputSettings(source.name);
	}

	async function loadInputSettings(inputName) {
		try {
			const response = await fetch(`${API_PREFIX}/api/obs/inputs?inputName=${encodeURIComponent(inputName)}`);
			const data = await response.json();
			if (data.settings && data.settings.text) {
				// Store text in selectedSource for editing
				selectedSource.text = data.settings.text;
			}
		} catch (error) {
			console.error('Failed to load input settings:', error);
		}
	}

	async function updateText() {
		if (!selectedSource) return;
		try {
			await fetch(`${API_PREFIX}/api/obs/inputs`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'setSettings', 
					inputName: selectedSource.name, 
					inputSettings: { text: selectedSource.text } 
				})
			});
			alert('Text updated!');
		} catch (error) {
			console.error('Failed to update text:', error);
			alert('Failed to update text: ' + error.message);
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
						<div class="source-actions">
							<button class="action-btn" on:click={() => selectSource(source)} title="Filters">🎨</button>
							<button class="action-btn" on:click={() => showTransformControls(source)} title="Transform">📐</button>
							<button class="action-btn" on:click={() => showScreenshotControls(source)} title="Screenshot">📷</button>
							{#if source.type === 'text_gdiplus' || source.type === 'text_ft2_source'}
								<button class="action-btn" on:click={() => showTextEdit(source)} title="Edit Text">📝</button>
							{/if}
						</div>
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
				<select class="transition-select" value={currentTransition} on:change={(e) => setTransition(e.target.value)}>
					{#each availableTransitions as transition}
						<option value={transition.transitionName}>{transition.transitionName}</option>
					{/each}
				</select>
				<label class="duration-label">
					Duration:
					<input 
						type="number" 
						bind:value={transitionDuration}
						on:change={setTransitionDuration}
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

	<!-- Advanced Controls Side Panels -->
	{#if showFiltersPanel && selectedSource}
		<div class="side-panel filters-panel-side">
			<div class="side-panel-header">
				<h3>Filters: {selectedSource.name}</h3>
				<button class="close-btn" on:click={() => showFiltersPanel = false}>✕</button>
			</div>
			<div class="side-panel-content">
				<button class="add-btn" on:click={addFilter}>+ Add Filter</button>
				{#each sourceFilters as filter}
					<div class="filter-item">
						<input 
							type="checkbox" 
							checked={filter.filterEnabled} 
							on:change={(e) => toggleFilter(filter.filterName, e.target.checked)}
						/>
						<span class="filter-name">{filter.filterName}</span>
						<button class="remove-btn" on:click={() => removeFilter(filter.filterName)}>🗑️</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if showTransformPanel && selectedSource && sourceTransform}
		<div class="side-panel transform-panel-side">
			<div class="side-panel-header">
				<h3>Transform: {selectedSource.name}</h3>
				<button class="close-btn" on:click={() => showTransformPanel = false}>✕</button>
			</div>
			<div class="side-panel-content">
				<div class="transform-controls">
					<label>
						Position X:
						<input type="number" bind:value={sourceTransform.positionX} />
					</label>
					<label>
						Position Y:
						<input type="number" bind:value={sourceTransform.positionY} />
					</label>
					<label>
						Scale X:
						<input type="number" step="0.1" bind:value={sourceTransform.scaleX} />
					</label>
					<label>
						Scale Y:
						<input type="number" step="0.1" bind:value={sourceTransform.scaleY} />
					</label>
					<label>
						Rotation:
						<input type="number" bind:value={sourceTransform.rotation} />
					</label>
					<label>
						Width:
						<input type="number" bind:value={sourceTransform.sourceWidth} />
					</label>
					<label>
						Height:
						<input type="number" bind:value={sourceTransform.sourceHeight} />
					</label>
					<button class="apply-btn" on:click={updateTransform}>Apply Transform</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showScreenshotPanel && selectedSource}
		<div class="side-panel screenshot-panel-side">
			<div class="side-panel-header">
				<h3>Screenshot: {selectedSource.name}</h3>
				<button class="close-btn" on:click={() => showScreenshotPanel = false}>✕</button>
			</div>
			<div class="side-panel-content">
				<button class="screenshot-btn" on:click={takeScreenshot}>📷 Take Screenshot</button>
				<p class="help-text">Click to save a screenshot of this source</p>
			</div>
		</div>
	{/if}

	{#if showTextEditor && selectedSource}
		<div class="side-panel text-editor-panel">
			<div class="side-panel-header">
				<h3>Edit Text: {selectedSource.name}</h3>
				<button class="close-btn" on:click={() => showTextEditor = false}>✕</button>
			</div>
			<div class="side-panel-content">
				<textarea 
					bind:value={selectedSource.text} 
					rows="10" 
					placeholder="Enter text..."
					class="text-editor"
				></textarea>
				<button class="apply-btn" on:click={updateText}>Update Text</button>
			</div>
		</div>
	{/if}
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

	/* Source Actions */
	.source-actions {
		display: flex;
		gap: 4px;
		margin-left: auto;
	}

	.action-btn {
		background: rgba(145, 71, 255, 0.2);
		border: 1px solid rgba(145, 71, 255, 0.4);
		color: #9147ff;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.action-btn:hover {
		background: rgba(145, 71, 255, 0.4);
	}

	/* Side Panels */
	.side-panel {
		position: fixed;
		right: 0;
		top: 50px;
		width: 400px;
		height: calc(100vh - 50px);
		background: #1f1f2e;
		border-left: 2px solid #9147ff;
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.side-panel-header {
		padding: 20px;
		background: #13131a;
		border-bottom: 1px solid #333;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.side-panel-header h3 {
		margin: 0;
		color: #9147ff;
		font-size: 16px;
	}

	.close-btn {
		background: rgba(233, 25, 22, 0.2);
		border: 1px solid rgba(233, 25, 22, 0.4);
		color: #e91916;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 18px;
	}

	.close-btn:hover {
		background: rgba(233, 25, 22, 0.4);
	}

	.side-panel-content {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
	}

	/* Filters Panel */
	.add-btn {
		width: 100%;
		padding: 12px;
		background: rgba(0, 245, 147, 0.2);
		border: 1px solid rgba(0, 245, 147, 0.4);
		color: #00f593;
		border-radius: 4px;
		cursor: pointer;
		margin-bottom: 15px;
		font-size: 14px;
	}

	.add-btn:hover {
		background: rgba(0, 245, 147, 0.3);
	}

	.filter-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		margin-bottom: 8px;
	}

	.filter-name {
		flex: 1;
		color: #fff;
	}

	.remove-btn {
		background: rgba(233, 25, 22, 0.2);
		border: 1px solid rgba(233, 25, 22, 0.4);
		color: #e91916;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
	}

	.remove-btn:hover {
		background: rgba(233, 25, 22, 0.4);
	}

	/* Transform Panel */
	.transform-controls {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.transform-controls label {
		display: flex;
		flex-direction: column;
		gap: 5px;
		color: #fff;
		font-size: 14px;
	}

	.transform-controls input {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid #333;
		color: #fff;
		padding: 8px;
		border-radius: 4px;
	}

	.apply-btn {
		width: 100%;
		padding: 12px;
		background: rgba(145, 71, 255, 0.3);
		border: 1px solid #9147ff;
		color: #fff;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		margin-top: 10px;
	}

	.apply-btn:hover {
		background: rgba(145, 71, 255, 0.5);
	}

	/* Screenshot Panel */
	.screenshot-btn {
		width: 100%;
		padding: 15px;
		background: rgba(0, 245, 147, 0.2);
		border: 1px solid rgba(0, 245, 147, 0.4);
		color: #00f593;
		border-radius: 4px;
		cursor: pointer;
		font-size: 16px;
		margin-bottom: 10px;
	}

	.screenshot-btn:hover {
		background: rgba(0, 245, 147, 0.3);
	}

	.help-text {
		color: #999;
		font-size: 14px;
		text-align: center;
	}

	/* Text Editor Panel */
	.text-editor {
		width: 100%;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid #333;
		color: #fff;
		padding: 12px;
		border-radius: 4px;
		font-family: 'Consolas', 'Monaco', monospace;
		font-size: 14px;
		resize: vertical;
	}
</style>
