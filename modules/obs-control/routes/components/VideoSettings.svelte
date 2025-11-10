<script>
	import { videoSettings } from '../stores/obsStatus.js';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let baseWidth = 1920;
	let baseHeight = 1080;
	let scaledWidth = 1920;
	let scaledHeight = 1080;
	let selectedFps = 60;
	let selectedFormat = 'I420';

	const presets = [
		{ name: '480p', width: 854, height: 480 },
		{ name: '720p', width: 1280, height: 720 },
		{ name: '1080p', width: 1920, height: 1080 },
		{ name: '1440p', width: 2560, height: 1440 },
		{ name: '4K', width: 3840, height: 2160 },
		{ name: 'Ultrawide', width: 3440, height: 1440 }
	];

	const frameRates = [24, 29.97, 30, 48, 50, 59.94, 60];
	const formats = ['I420', 'NV12', 'UYVY', 'YUY2'];

	$: if ($videoSettings) {
		baseWidth = $videoSettings.baseResolution?.width || 1920;
		baseHeight = $videoSettings.baseResolution?.height || 1080;
		scaledWidth = $videoSettings.scaledResolution?.width || 1920;
		scaledHeight = $videoSettings.scaledResolution?.height || 1080;
		selectedFps = $videoSettings.frameRate || 60;
		selectedFormat = $videoSettings.videoFormat || 'I420';
	}

	async function applyBaseResolution() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetBaseResolution', {
				width: parseInt(baseWidth),
				height: parseInt(baseHeight)
			});
		} catch (err) {
			console.error('Failed to set base resolution:', err);
		} finally {
			isLoading = false;
		}
	}

	async function applyScaledResolution() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetScaledResolution', {
				width: parseInt(scaledWidth),
				height: parseInt(scaledHeight)
			});
		} catch (err) {
			console.error('Failed to set scaled resolution:', err);
		} finally {
			isLoading = false;
		}
	}

	async function applyFrameRate() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetFrameRate', { fps: parseFloat(selectedFps) });
		} catch (err) {
			console.error('Failed to set frame rate:', err);
		} finally {
			isLoading = false;
		}
	}

	async function applyFormat() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetVideoFormat', { format: selectedFormat });
		} catch (err) {
			console.error('Failed to set video format:', err);
		} finally {
			isLoading = false;
		}
	}

	async function applyPreset(preset) {
		isLoading = true;
		try {
			sendWebSocketMessage('ApplyResolutionPreset', {
				preset: preset.name,
				targetType: 'base'
			});
		} catch (err) {
			console.error('Failed to apply preset:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="video-settings">
	<h2>Video Output Settings</h2>

	<div class="settings-grid">
		<!-- Base Resolution -->
		<div class="settings-card">
			<h3>📐 Base Resolution</h3>
			<div class="resolution-input">
				<div class="input-group">
					<label for="base-width">Width</label>
					<input
						id="base-width"
						type="number"
						min="640"
						max="7680"
						step="1"
						bind:value={baseWidth}
						disabled={isLoading}
					/>
				</div>
				<span class="x">×</span>
				<div class="input-group">
					<label for="base-height">Height</label>
					<input
						id="base-height"
						type="number"
						min="480"
						max="4320"
						step="1"
						bind:value={baseHeight}
						disabled={isLoading}
					/>
				</div>
			</div>
			<button class="btn btn-primary" on:click={applyBaseResolution} disabled={isLoading}>
				Apply
			</button>
			<div class="current-value">Current: {baseWidth} × {baseHeight}</div>
		</div>

		<!-- Scaled Resolution -->
		<div class="settings-card">
			<h3>🔍 Scaled Resolution</h3>
			<div class="resolution-input">
				<div class="input-group">
					<label for="scaled-width">Width</label>
					<input
						id="scaled-width"
						type="number"
						min="640"
						max="7680"
						step="1"
						bind:value={scaledWidth}
						disabled={isLoading}
					/>
				</div>
				<span class="x">×</span>
				<div class="input-group">
					<label for="scaled-height">Height</label>
					<input
						id="scaled-height"
						type="number"
						min="480"
						max="4320"
						step="1"
						bind:value={scaledHeight}
						disabled={isLoading}
					/>
				</div>
			</div>
			<button class="btn btn-primary" on:click={applyScaledResolution} disabled={isLoading}>
				Apply
			</button>
			<div class="current-value">Current: {scaledWidth} × {scaledHeight}</div>
		</div>

		<!-- Frame Rate -->
		<div class="settings-card">
			<h3>⚡ Frame Rate</h3>
			<select bind:value={selectedFps} disabled={isLoading}>
				{#each frameRates as fps}
					<option value={fps}>{fps} fps</option>
				{/each}
			</select>
			<button class="btn btn-primary" on:click={applyFrameRate} disabled={isLoading}>
				Apply
			</button>
			<div class="current-value">Current: {selectedFps} fps</div>
		</div>

		<!-- Video Format -->
		<div class="settings-card">
			<h3>🎨 Video Format</h3>
			<select bind:value={selectedFormat} disabled={isLoading}>
				{#each formats as format}
					<option value={format}>{format}</option>
				{/each}
			</select>
			<button class="btn btn-primary" on:click={applyFormat} disabled={isLoading}>
				Apply
			</button>
			<div class="current-value">Current: {selectedFormat}</div>
		</div>
	</div>

	<!-- Presets -->
	<div class="presets-section">
		<h3>🎯 Resolution Presets</h3>
		<div class="presets-grid">
			{#each presets as preset}
				<button
					class="preset-btn"
					on:click={() => applyPreset(preset)}
					disabled={isLoading}
					title={`${preset.width}×${preset.height}`}
				>
					<div class="preset-name">{preset.name}</div>
					<div class="preset-res">{preset.width}×{preset.height}</div>
				</button>
			{/each}
		</div>
	</div>
</div>


<style>
	.video-settings {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.video-settings h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.settings-card {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.settings-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1rem;
		color: var(--color-accent);
	}

	.resolution-input {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.25rem;
	}

	.input-group label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-weight: 500;
		text-transform: uppercase;
	}

	.input-group input {
		padding: 0.5rem;
		background-color: var(--color-primary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.x {
		color: var(--color-text-muted);
		font-weight: 600;
		font-size: 1.25rem;
		align-self: center;
		margin-bottom: 0.5rem;
	}

	select {
		width: 100%;
		padding: 0.5rem;
		background-color: var(--color-primary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		color: var(--color-text);
		font-size: 0.875rem;
		margin-bottom: 1rem;
		cursor: pointer;
	}

	select:hover:not(:disabled) {
		border-color: var(--color-accent);
	}

	select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn {
		width: 100%;
		padding: 0.5rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		margin-bottom: 0.75rem;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.current-value {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		padding-top: 0.5rem;
		border-top: 1px solid rgba(59, 130, 246, 0.1);
	}

	.presets-section {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.presets-section h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: var(--color-accent);
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.preset-btn {
		padding: 1rem 0.75rem;
		background-color: rgba(59, 130, 246, 0.1);
		border: 2px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-text);
		font-weight: 500;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.preset-btn:hover:not(:disabled) {
		background-color: rgba(59, 130, 246, 0.2);
		border-color: var(--color-accent);
	}

	.preset-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.preset-name {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.preset-res {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 768px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}

		.resolution-input {
			flex-direction: column;
		}

		.x {
			align-self: flex-start;
			margin-bottom: 0;
			margin-top: 0.5rem;
		}
	}
</style>
