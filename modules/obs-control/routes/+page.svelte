<script>
	import { onMount } from 'svelte';
	import ConnectionStatus from './components/ConnectionStatus.svelte';
	import ProfileSwitcher from './components/ProfileSwitcher.svelte';
	import CollectionSwitcher from './components/CollectionSwitcher.svelte';
	import VideoSettings from './components/VideoSettings.svelte';
	import ReplayBufferControl from './components/ReplayBufferControl.svelte';
	import VirtualCamControl from './components/VirtualCamControl.svelte';
	import AutomationBuilder from './components/AutomationBuilder.svelte';
	import AlertTester from './components/AlertTester.svelte';
	import Tabs from './components/Tabs.svelte';

	import { connectionStatus, uptime } from './stores/obsStatus.js';
	import { initializeWebSocket } from './lib/websocket.js';

	let activeTab = 'status';
	let connectionUptime = '00:00:00';

	const tabs = [
		{ id: 'status', label: 'Status', icon: '📊' },
		{ id: 'profiles', label: 'Profiles', icon: '🎛️' },
		{ id: 'collections', label: 'Collections', icon: '🎭' },
		{ id: 'video', label: 'Video Settings', icon: '📹' },
		{ id: 'replay', label: 'Replay Buffer', icon: '🎬' },
		{ id: 'virtualcam', label: 'Virtual Camera', icon: '📷' },
		{ id: 'automation', label: 'Automation', icon: '⚙️' },
		{ id: 'alerts', label: 'Alert Testing', icon: '🔔' }
	];

	onMount(async () => {
		// Initialize WebSocket for real-time updates
		initializeWebSocket();

		// Start uptime ticker
		const uptimeInterval = setInterval(() => {
			connectionUptime = incrementTime(connectionUptime);
		}, 1000);

		return () => clearInterval(uptimeInterval);
	});

	function incrementTime(time) {
		const [hours, minutes, seconds] = time.split(':').map(Number);
		let h = hours;
		let m = minutes;
		let s = seconds + 1;

		if (s === 60) {
			s = 0;
			m += 1;
		}
		if (m === 60) {
			m = 0;
			h += 1;
		}

		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
</script>

<div class="obs-control-dashboard">
	<header class="dashboard-header">
		<div class="header-content">
			<h1 class="dashboard-title">🎛️ OBS Master Control Panel</h1>
			<div class="version-badge">v2.3.0</div>
		</div>
		<ConnectionStatus {uptime} />
	</header>

	<main class="dashboard-main">
		<Tabs {tabs} bind:activeTab />

		<section class="tab-content">
			{#if activeTab === 'status'}
				<div class="status-overview">
					<div class="status-card">
						<h2>Dashboard Overview</h2>
						<div class="status-grid">
							<div class="stat-item">
								<span class="stat-label">Controllers</span>
								<span class="stat-value">14</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Methods</span>
								<span class="stat-value">174+</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Status</span>
								<span class="stat-value connected"
									>{$connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Offline'}</span
								>
							</div>
							<div class="stat-item">
								<span class="stat-label">Uptime</span>
								<span class="stat-value">{connectionUptime}</span>
							</div>
						</div>
					</div>

					<div class="features-grid">
						<div class="feature-card">
							<h3>🎯 Quick Actions</h3>
							<p>Navigate to tabs above to:</p>
							<ul>
								<li>Switch profiles & collections</li>
								<li>Adjust video settings</li>
								<li>Manage replay buffer</li>
								<li>Control virtual camera</li>
								<li>Build automation rules</li>
								<li>Test alerts</li>
							</ul>
						</div>

						<div class="feature-card">
							<h3>📊 Controllers Available</h3>
							<ul class="controller-list">
								<li>✓ Audio Mixer</li>
								<li>✓ Stream Control</li>
								<li>✓ Recording Control</li>
								<li>✓ Scene Items</li>
								<li>✓ Filters</li>
								<li>✓ Transitions</li>
								<li>✓ Profiles</li>
								<li>✓ Collections</li>
								<li>✓ Video Settings</li>
								<li>✓ Replay Buffer</li>
								<li>✓ Virtual Camera</li>
								<li>✓ Automation</li>
							</ul>
						</div>

						<div class="feature-card">
							<h3>🚀 Getting Started</h3>
							<ol>
								<li>Check connection status above</li>
								<li>Navigate to Profiles tab</li>
								<li>Switch to your streaming profile</li>
								<li>Adjust video settings if needed</li>
								<li>Start streaming!</li>
							</ol>
						</div>
					</div>
				</div>
			{:else if activeTab === 'profiles'}
				<ProfileSwitcher />
			{:else if activeTab === 'collections'}
				<CollectionSwitcher />
			{:else if activeTab === 'video'}
				<VideoSettings />
			{:else if activeTab === 'replay'}
				<ReplayBufferControl />
			{:else if activeTab === 'virtualcam'}
				<VirtualCamControl />
			{:else if activeTab === 'automation'}
				<AutomationBuilder />
			{:else if activeTab === 'alerts'}
				<AlertTester />
			{/if}
		</section>
	</main>
</div>

<style>
	:global(body) {
		--color-primary: #1f2937;
		--color-secondary: #374151;
		--color-accent: #3b82f6;
		--color-success: #10b981;
		--color-warning: #f59e0b;
		--color-error: #ef4444;
		--color-text: #f3f4f6;
		--color-text-muted: #9ca3af;

		background-color: var(--color-primary);
		color: var(--color-text);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		margin: 0;
		padding: 0;
	}

	.obs-control-dashboard {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: var(--color-primary);
		overflow: hidden;
	}

	.dashboard-header {
		background-color: var(--color-secondary);
		border-bottom: 2px solid var(--color-accent);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.dashboard-title {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.5px;
	}

	.version-badge {
		background-color: var(--color-accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.dashboard-main {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.status-overview {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.status-card {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.status-card h2 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.25rem;
		color: var(--color-accent);
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background-color: rgba(59, 130, 246, 0.1);
		border-radius: 0.375rem;
		border-left: 3px solid var(--color-accent);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.stat-value.connected {
		color: var(--color-success);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		background-color: var(--color-secondary);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.feature-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1rem;
		color: var(--color-accent);
	}

	.feature-card p {
		margin: 0 0 0.75rem 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.feature-card ul,
	.feature-card ol {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.feature-card li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.controller-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		padding: 0;
		list-style: none;
	}

	.controller-list li {
		padding: 0.5rem 0;
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.dashboard-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-content {
			width: 100%;
		}

		.dashboard-title {
			font-size: 1.25rem;
		}

		.tab-content {
			padding: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
