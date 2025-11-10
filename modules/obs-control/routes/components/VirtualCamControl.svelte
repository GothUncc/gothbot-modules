<script>
	import { virtualCameraState } from '../stores/obsStatus.js';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let selectedFormat = 'UYVY';

	const formats = ['UYVY', 'NV12', 'I420', 'XRGB', 'ARGB'];

	$: if ($virtualCameraState) {
		selectedFormat = $virtualCameraState.outputFormat || 'UYVY';
	}

	async function startVirtualCam() {
		isLoading = true;
		try {
			sendWebSocketMessage('StartVirtualCamera', {});
		} catch (err) {
			console.error('Failed to start virtual camera:', err);
		} finally {
			isLoading = false;
		}
	}

	async function stopVirtualCam() {
		isLoading = true;
		try {
			sendWebSocketMessage('StopVirtualCamera', {});
		} catch (err) {
			console.error('Failed to stop virtual camera:', err);
		} finally {
			isLoading = false;
		}
	}

	async function toggleVirtualCam() {
		if ($virtualCameraState?.active) {
			await stopVirtualCam();
		} else {
			await startVirtualCam();
		}
	}

	async function setFormat() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetVirtualCameraFormat', { format: selectedFormat });
		} catch (err) {
			console.error('Failed to set virtual camera format:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="virtual-cam-control">
	<h2>📷 Virtual Camera Manager</h2>

	<!-- Status Card -->
	<div class="status-card">
		<div class="status-header">
			<div class="status-indicator {$virtualCameraState?.active ? 'active' : 'inactive'}">
				<div class="status-dot"></div>
				<span class="status-text">
					{$virtualCameraState?.active ? 'Active' : 'Inactive'}
				</span>
			</div>
			<div class="status-subtext">
				{$virtualCameraState?.active
					? 'Virtual camera is broadcasting to your apps'
					: 'Virtual camera is not active'}
			</div>
		</div>

		<div class="status-details">
			<div class="detail-row">
				<span class="label">Output Format:</span>
				<span class="value">{selectedFormat}</span>
			</div>
			<div class="detail-row">
				<span class="label">Status:</span>
				<span class="value {$virtualCameraState?.active ? 'success' : 'muted'}">
					{$virtualCameraState?.active ? '🟢 Broadcasting' : '⚫ Offline'}
				</span>
			</div>
		</div>
	</div>

	<!-- Main Control Button -->
	<button
		class="btn btn-toggle {$virtualCameraState?.active ? 'btn-active' : 'btn-inactive'}"
		on:click={toggleVirtualCam}
		disabled={isLoading}
	>
		{$virtualCameraState?.active ? '🔴 Stop Virtual Camera' : '⚪ Start Virtual Camera'}
	</button>

	<!-- Format Selection -->
	<div class="format-section">
		<h3>🎨 Output Format</h3>
		<p class="format-description">
			Select the format for your virtual camera output. Different applications may require different
			formats for optimal compatibility.
		</p>

		<div class="format-grid">
			{#each formats as format}
				<button
					class="format-btn {selectedFormat === format ? 'selected' : ''}"
					on:click={() => {
						selectedFormat = format;
						setFormat();
					}}
					disabled={isLoading}
					title={`Video format: ${format}`}
				>
					<span class="format-name">{format}</span>
					<span class="format-desc">
						{format === 'UYVY'
							? 'Balanced'
							: format === 'NV12'
								? 'Compact'
								: format === 'I420'
									? 'Standard'
									: format === 'XRGB'
										? 'RGB'
										: 'ARGB'}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Compatibility Info -->
	<div class="info-card">
		<h4>🔗 Compatibility</h4>
		<div class="compat-list">
			<div class="compat-item">
				<span class="app-name">Zoom:</span>
				<span class="compat-status">UYVY, I420</span>
			</div>
			<div class="compat-item">
				<span class="app-name">Teams:</span>
				<span class="compat-status">UYVY, NV12</span>
			</div>
			<div class="compat-item">
				<span class="app-name">Discord:</span>
				<span class="compat-status">UYVY, I420</span>
			</div>
			<div class="compat-item">
				<span class="app-name">Skype:</span>
				<span class="compat-status">XRGB, UYVY</span>
			</div>
		</div>
	</div>

	<!-- Usage Tips -->
	<div class="tips-card">
		<h4>💡 Usage Tips</h4>
		<ul>
			<li>Start the virtual camera before joining a video call</li>
			<li>Select OBS as your camera in your video conferencing app</li>
			<li>Adjust format if you experience compatibility issues</li>
			<li>Virtual camera uses additional system resources</li>
			<li>Stop when not in use to save CPU</li>
		</ul>
	</div>
</div>


<style>
	.virtual-cam-control {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.virtual-cam-control h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.status-card {
		background-color: var(--color-secondary);
		border: 2px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.status-header {
		margin-bottom: 1rem;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.status-indicator.active {
		color: var(--color-success);
	}

	.status-indicator.inactive {
		color: var(--color-text-muted);
	}

	.status-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background-color: currentColor;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.status-indicator.inactive .status-dot {
		animation: none;
		opacity: 0.5;
	}

	.status-text {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.status-subtext {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.status-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(59, 130, 246, 0.1);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.label {
		color: var(--color-text-muted);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.value {
		font-weight: 600;
		color: var(--color-text);
	}

	.value.success {
		color: var(--color-success);
	}

	.value.muted {
		color: var(--color-text-muted);
	}

	.btn-toggle {
		padding: 1.25rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s ease;
		width: 100%;
	}

	.btn-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-inactive {
		background-color: var(--color-success);
		color: white;
	}

	.btn-inactive:hover:not(:disabled) {
		background-color: #059669;
	}

	.btn-active {
		background-color: var(--color-error);
		color: white;
	}

	.btn-active:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.format-section {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.format-section h3 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--color-accent);
	}

	.format-description {
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.format-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.format-btn {
		padding: 1rem 0.75rem;
		background-color: rgba(59, 130, 246, 0.05);
		border: 2px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: var(--color-text);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.format-btn:hover:not(:disabled) {
		background-color: rgba(59, 130, 246, 0.15);
		border-color: var(--color-accent);
	}

	.format-btn.selected {
		background-color: rgba(59, 130, 246, 0.3);
		border-color: var(--color-accent);
	}

	.format-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.format-name {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.format-desc {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.info-card {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.info-card h4 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: var(--color-accent);
	}

	.compat-list {
		display: grid;
		gap: 0.75rem;
	}

	.compat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background-color: rgba(59, 130, 246, 0.05);
		border-radius: 0.375rem;
	}

	.app-name {
		font-weight: 500;
		color: var(--color-text);
	}

	.compat-status {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.tips-card {
		background-color: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.tips-card h4 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: var(--color-success);
	}

	.tips-card ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style: disc;
	}

	.tips-card li {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@media (max-width: 768px) {
		.detail-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.format-grid {
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		}
	}
</style>
