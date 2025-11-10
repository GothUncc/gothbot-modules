<script>
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let testResult = null;
	let lastTestedAlert = '';

	const alerts = [
		{
			id: 'follow',
			name: 'Follow Alert',
			icon: '👥',
			description: 'Simulate a channel follow',
			color: 'blue'
		},
		{
			id: 'donation',
			name: 'Donation Alert',
			icon: '💰',
			description: 'Simulate a donation',
			color: 'green'
		},
		{
			id: 'subscription',
			name: 'Subscription Alert',
			icon: '⭐',
			description: 'Simulate a subscription',
			color: 'purple'
		},
		{
			id: 'raid',
			name: 'Raid Alert',
			icon: '⚔️',
			description: 'Simulate a channel raid',
			color: 'orange'
		},
		{
			id: 'host',
			name: 'Host Alert',
			icon: '🏠',
			description: 'Simulate a channel host',
			color: 'red'
		},
		{
			id: 'cheer',
			name: 'Cheer Alert',
			icon: '🎉',
			description: 'Simulate bits/cheer',
			color: 'yellow'
		}
	];

	async function testAlert(alertId) {
		isLoading = true;
		lastTestedAlert = alertId;

		try {
			sendWebSocketMessage('TestAlert', {
				alertType: alertId,
				data: {
					username: `TestUser_${Math.floor(Math.random() * 10000)}`,
					amount: alertId === 'donation' ? 50 : alertId === 'cheer' ? 100 : 1,
					message: `Test ${alertId} alert`
				}
			});

			testResult = {
				type: 'success',
				message: `✅ ${alertId.toUpperCase()} alert sent!`,
				timestamp: new Date().toLocaleTimeString()
			};

			setTimeout(() => {
				testResult = null;
			}, 5000);
		} catch (err) {
			console.error('Failed to test alert:', err);
			testResult = {
				type: 'error',
				message: `❌ Failed to send alert: ${err.message}`,
				timestamp: new Date().toLocaleTimeString()
			};
		} finally {
			isLoading = false;
		}
	}

	function getAlertColor(color) {
		const colors = {
			blue: 'alert-blue',
			green: 'alert-green',
			purple: 'alert-purple',
			orange: 'alert-orange',
			red: 'alert-red',
			yellow: 'alert-yellow'
		};
		return colors[color] || 'alert-blue';
	}
</script>

<div class="alert-tester">
	<h2>🔔 Alert Testing Manager</h2>

	<p class="description">
		Test all your alert configurations to ensure they're working correctly. Click any alert type below
		to trigger a test alert.
	</p>

	<!-- Test Result Notification -->
	{#if testResult}
		<div class="test-result {testResult.type}">
			<div class="result-message">{testResult.message}</div>
			<div class="result-time">{testResult.timestamp}</div>
		</div>
	{/if}

	<!-- Alerts Grid -->
	<div class="alerts-grid">
		{#each alerts as alert (alert.id)}
			<button
				class="alert-btn {getAlertColor(alert.color)}"
				on:click={() => testAlert(alert.id)}
				disabled={isLoading}
				title={alert.description}
			>
				<div class="alert-icon">{alert.icon}</div>
				<div class="alert-name">{alert.name}</div>
				<div class="alert-desc">{alert.description}</div>
				{#if lastTestedAlert === alert.id && isLoading}
					<div class="loading-spinner"></div>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Configuration Info -->
	<div class="config-section">
		<h3>⚙️ Alert Configuration</h3>
		<div class="config-cards">
			<div class="config-card">
				<h4>Follow Alerts</h4>
				<ul>
					<li>Trigger on channel follow</li>
					<li>Customizable message</li>
					<li>Sound notification available</li>
				</ul>
			</div>

			<div class="config-card">
				<h4>Donation Alerts</h4>
				<ul>
					<li>Trigger on donation received</li>
					<li>Amount-based customization</li>
					<li>Donor name display</li>
				</ul>
			</div>

			<div class="config-card">
				<h4>Subscription Alerts</h4>
				<ul>
					<li>Tier 1, Tier 2, Tier 3</li>
					<li>Re-subscription tracking</li>
					<li>Cumulative month display</li>
				</ul>
			</div>

			<div class="config-card">
				<h4>Raid Alerts</h4>
				<ul>
					<li>Notify on incoming raids</li>
					<li>Viewer count display</li>
					<li>Raider name shown</li>
				</ul>
			</div>

			<div class="config-card">
				<h4>Host Alerts</h4>
				<ul>
					<li>Incoming host notification</li>
					<li>Viewer count tracking</li>
					<li>Auto-host alerts</li>
				</ul>
			</div>

			<div class="config-card">
				<h4>Cheer Alerts</h4>
				<ul>
					<li>Bit cheer notifications</li>
					<li>Amount-based tiers</li>
					<li>Message with bits</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Usage Tips -->
	<div class="tips-card">
		<h4>💡 Tips for Alert Testing</h4>
		<ul>
			<li>Test alerts to verify they're working before going live</li>
			<li>Check that audio and visual components both trigger</li>
			<li>Verify alert overlays appear in the correct screen area</li>
			<li>Test with different alert amounts/tiers</li>
			<li>Confirm message text displays correctly</li>
			<li>Check for any blocking issues or timing problems</li>
		</ul>
	</div>
</div>


<style>
	.alert-tester {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.alert-tester h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.description {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.test-result {
		padding: 1rem;
		border-radius: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		animation: slideIn 0.3s ease;
	}

	.test-result.success {
		background-color: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.test-result.error {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.result-message {
		font-weight: 600;
		color: var(--color-text);
	}

	.test-result.success .result-message {
		color: var(--color-success);
	}

	.test-result.error .result-message {
		color: var(--color-error);
	}

	.result-time {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.alerts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.alert-btn {
		padding: 1.5rem 1rem;
		border: 2px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		position: relative;
		color: white;
		font-weight: 600;
	}

	.alert-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.alert-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.alert-blue {
		background-color: #3b82f6;
		border-color: #2563eb;
	}

	.alert-blue:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.alert-green {
		background-color: #10b981;
		border-color: #059669;
	}

	.alert-green:hover:not(:disabled) {
		background-color: #059669;
	}

	.alert-purple {
		background-color: #a855f7;
		border-color: #9333ea;
	}

	.alert-purple:hover:not(:disabled) {
		background-color: #9333ea;
	}

	.alert-orange {
		background-color: #f59e0b;
		border-color: #d97706;
	}

	.alert-orange:hover:not(:disabled) {
		background-color: #d97706;
	}

	.alert-red {
		background-color: #ef4444;
		border-color: #dc2626;
	}

	.alert-red:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.alert-yellow {
		background-color: #eab308;
		border-color: #ca8a04;
		color: #1f2937;
	}

	.alert-yellow:hover:not(:disabled) {
		background-color: #ca8a04;
		color: white;
	}

	.alert-icon {
		font-size: 2rem;
	}

	.alert-name {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.alert-desc {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.loading-spinner {
		position: absolute;
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.config-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.config-section h3 {
		margin: 0;
		color: var(--color-accent);
	}

	.config-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.config-card {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.config-card h4 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: var(--color-accent);
		font-size: 0.95rem;
	}

	.config-card ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style: disc;
	}

	.config-card li {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.tips-card {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.tips-card h4 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: var(--color-accent);
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

	@media (max-width: 768px) {
		.alerts-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 0.75rem;
		}

		.alert-btn {
			padding: 1rem 0.75rem;
		}

		.alert-icon {
			font-size: 1.5rem;
		}

		.config-cards {
			grid-template-columns: 1fr;
		}

		.test-result {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}
	}
</style>
