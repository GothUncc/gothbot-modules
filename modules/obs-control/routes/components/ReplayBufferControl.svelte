<script>
	import { replayBufferState } from '../stores/obsStatus.js';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let bufferDuration = 300;
	let showDurationForm = false;

	$: if ($replayBufferState) {
		bufferDuration = $replayBufferState.maxDurationSeconds || 300;
	}

	async function startBuffer() {
		isLoading = true;
		try {
			sendWebSocketMessage('StartReplayBuffer', {});
		} catch (err) {
			console.error('Failed to start replay buffer:', err);
		} finally {
			isLoading = false;
		}
	}

	async function stopBuffer() {
		isLoading = true;
		try {
			sendWebSocketMessage('StopReplayBuffer', {});
		} catch (err) {
			console.error('Failed to stop replay buffer:', err);
		} finally {
			isLoading = false;
		}
	}

	async function saveClip() {
		isLoading = true;
		try {
			sendWebSocketMessage('SaveReplayBuffer', {});
		} catch (err) {
			console.error('Failed to save replay buffer:', err);
		} finally {
			isLoading = false;
		}
	}

	async function toggleBuffer() {
		if ($replayBufferState?.active) {
			await stopBuffer();
		} else {
			await startBuffer();
		}
	}

	async function setBufferDuration() {
		isLoading = true;
		try {
			sendWebSocketMessage('SetReplayBufferDuration', {
				maxSeconds: parseInt(bufferDuration)
			});
			showDurationForm = false;
		} catch (err) {
			console.error('Failed to set buffer duration:', err);
		} finally {
			isLoading = false;
		}
	}

	function formatTime(seconds) {
		if (!seconds) return '00:00';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
</script>

<div class="replay-buffer-control">
	<h2>🎬 Replay Buffer Manager</h2>

	<!-- Status Card -->
	<div class="status-card">
		<div class="status-row">
			<span class="label">Status:</span>
			<span class="value {$replayBufferState?.active ? 'active' : 'inactive'}">
				{$replayBufferState?.active ? '🟢 Recording' : '⚫ Stopped'}
			</span>
		</div>
		<div class="status-row">
			<span class="label">Buffer Duration:</span>
			<span class="value">{formatTime($replayBufferState?.maxDurationSeconds || 300)}</span>
		</div>
		<div class="status-row">
			<span class="label">Saved Clips:</span>
			<span class="value highlight">{$replayBufferState?.savedClips || 0}</span>
		</div>
		{#if $replayBufferState?.lastSaveTime}
			<div class="status-row">
				<span class="label">Last Save:</span>
				<span class="value">{new Date($replayBufferState.lastSaveTime).toLocaleTimeString()}</span>
			</div>
		{/if}
	</div>

	<!-- Control Buttons -->
	<div class="controls">
		<button
			class="btn btn-large {$replayBufferState?.active ? 'btn-stop' : 'btn-start'}"
			on:click={toggleBuffer}
			disabled={isLoading}
		>
			{$replayBufferState?.active ? '⏹ Stop Recording' : '⏹ Start Recording'}
		</button>

		<button
			class="btn btn-large btn-save"
			on:click={saveClip}
			disabled={!$replayBufferState?.active || isLoading}
			title="Save clip from replay buffer"
		>
			💾 Save Clip
		</button>
	</div>

	<!-- Duration Configuration -->
	<div class="duration-section">
		<button
			class="btn btn-secondary"
			on:click={() => (showDurationForm = !showDurationForm)}
			disabled={isLoading}
		>
			⚙️ Configure Duration
		</button>

		{#if showDurationForm}
			<div class="duration-form">
				<div class="form-group">
					<label for="duration-input">Buffer Duration (seconds)</label>
					<input
						id="duration-input"
						type="number"
						min="5"
						max="3600"
						step="5"
						bind:value={bufferDuration}
						disabled={isLoading}
					/>
					<div class="duration-info">
						Recommended: 5-600 seconds ({formatTime(bufferDuration)})
					</div>
				</div>

				<div class="form-actions">
					<button class="btn btn-primary" on:click={setBufferDuration} disabled={isLoading}>
						Apply
					</button>
					<button class="btn btn-secondary" on:click={() => (showDurationForm = false)}>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Info Card -->
	<div class="info-card">
		<h4>💡 How to Use</h4>
		<ul>
			<li>Click "Start Recording" to begin recording to replay buffer</li>
			<li>Use "Save Clip" to save the last N seconds to disk</li>
			<li>Adjust buffer duration based on how far back you want to record</li>
			<li>Longer buffers use more RAM and CPU</li>
			<li>Default is 5 minutes (300 seconds)</li>
		</ul>
	</div>
</div>


<style>
	.replay-buffer-control {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.replay-buffer-control h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.status-card {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.status-row:last-child {
		border-bottom: none;
	}

	.label {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.value {
		font-weight: 600;
		color: var(--color-text);
	}

	.value.active {
		color: var(--color-success);
	}

	.value.inactive {
		color: var(--color-text-muted);
	}

	.value.highlight {
		color: var(--color-accent);
		font-size: 1.1rem;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.btn {
		padding: 1rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-large {
		padding: 1.25rem 1rem;
		font-size: 1rem;
	}

	.btn-start {
		background-color: var(--color-success);
		color: white;
	}

	.btn-start:hover:not(:disabled) {
		background-color: #059669;
	}

	.btn-stop {
		background-color: var(--color-error);
		color: white;
	}

	.btn-stop:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.btn-save {
		background-color: var(--color-accent);
		color: white;
	}

	.btn-save:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-secondary {
		background-color: var(--color-secondary);
		color: var(--color-text);
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-primary);
	}

	.btn-primary {
		background-color: var(--color-accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.duration-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.duration-form {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.form-group input {
		padding: 0.5rem;
		background-color: var(--color-primary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.duration-info {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		padding-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
	}

	.form-actions .btn {
		flex: 1;
		padding: 0.5rem 1rem;
	}

	.info-card {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.info-card h4 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: var(--color-accent);
	}

	.info-card ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style: disc;
	}

	.info-card li {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.controls {
			grid-template-columns: 1fr;
		}

		.status-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
