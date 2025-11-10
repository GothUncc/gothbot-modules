<script>
	import { connectionStatus, lastUpdate } from '../stores/obsStatus.js';

	export let uptime = '00:00:00';

	$: isConnected = $connectionStatus === 'connected';
	$: statusColor = isConnected ? 'connected' : 'disconnected';
	$: statusText = isConnected ? 'Connected' : 'Offline';
</script>

<div class="connection-status">
	<div class="status-indicator {statusColor}">
		<span class="status-dot"></span>
		<div class="status-info">
			<div class="status-label">{statusText}</div>
			<div class="status-uptime">Uptime: {uptime}</div>
		</div>
	</div>
	<div class="last-update">Last update: {$lastUpdate || 'Never'}</div>
</div>

<style>
	.connection-status {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background-color: rgba(59, 130, 246, 0.1);
		border-radius: 0.375rem;
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.status-indicator.connected {
		border-color: rgba(16, 185, 129, 0.3);
		background-color: rgba(16, 185, 129, 0.1);
	}

	.status-indicator.disconnected {
		border-color: rgba(239, 68, 68, 0.3);
		background-color: rgba(239, 68, 68, 0.1);
	}

	.status-dot {
		display: inline-block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background-color: #10b981;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.status-indicator.disconnected .status-dot {
		background-color: #ef4444;
		animation: none;
	}

	.status-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.status-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #f3f4f6;
	}

	.status-uptime {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.last-update {
		font-size: 0.75rem;
		color: #6b7280;
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
		.connection-status {
			align-items: flex-start;
		}

		.status-indicator {
			flex-direction: column;
		}
	}
</style>
