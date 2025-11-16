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

<div class="obs-master-control">
	<!-- Left Sidebar Navigation -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<h1 class="sidebar-title">OBS Master Control Panel</h1>
			<div class="version">v2.3.0</div>
		</div>

		<nav class="sidebar-nav">
			{#each tabs as tab}
				<button
					class="nav-item"
					class:active={activeTab === tab.id}
					on:click={() => (activeTab = tab.id)}
				>
					<span class="nav-icon">{tab.icon}</span>
					<span class="nav-label">{tab.label}</span>
				</button>
			{/each}
		</nav>
	</aside>

	<!-- Main Content Area -->
	<div class="main-container">
		<!-- Top Header Bar -->
		<header class="topbar">
			<div class="topbar-left">
				<h2 class="page-title">{tabs.find((t) => t.id === activeTab)?.label || 'Dashboard'}</h2>
			</div>
			<div class="topbar-right">
				<div class="status-indicator" class:connected={$connectionStatus === 'connected'}>
					<span class="status-dot"></span>
					<span class="status-text"
						>{$connectionStatus === 'connected' ? 'Connected' : 'Offline'}</span
					>
				</div>
				<div class="uptime">
					<span class="uptime-label">Uptime:</span>
					<span class="uptime-value">{connectionUptime}</span>
				</div>
			</div>
		</header>

		<!-- Content Area -->
		<main class="content">
			{#if activeTab === 'status'}
				<div class="dashboard-grid">
					<!-- Stats Cards -->
					<div class="stats-row">
						<div class="stat-card">
							<div class="stat-label">Controllers</div>
							<div class="stat-value">14</div>
						</div>
						<div class="stat-card">
							<div class="stat-label">Methods</div>
							<div class="stat-value">174+</div>
						</div>
						<div class="stat-card">
							<div class="stat-label">Status</div>
							<div class="stat-value" class:connected={$connectionStatus === 'connected'}>
								{$connectionStatus === 'connected' ? 'Online' : 'Offline'}
							</div>
						</div>
						<div class="stat-card">
							<div class="stat-label">Uptime</div>
							<div class="stat-value">{connectionUptime}</div>
						</div>
					</div>

					<!-- Info Cards -->
					<div class="info-cards">
						<div class="info-card">
							<h3>Controllers Available</h3>
							<div class="controller-grid">
								<div class="controller-item">✓ Audio Mixer</div>
								<div class="controller-item">✓ Stream Control</div>
								<div class="controller-item">✓ Recording Control</div>
								<div class="controller-item">✓ Scene Items</div>
								<div class="controller-item">✓ Filters</div>
								<div class="controller-item">✓ Transitions</div>
								<div class="controller-item">✓ Profiles</div>
								<div class="controller-item">✓ Collections</div>
								<div class="controller-item">✓ Video Settings</div>
								<div class="controller-item">✓ Replay Buffer</div>
								<div class="controller-item">✓ Virtual Camera</div>
								<div class="controller-item">✓ Automation</div>
							</div>
						</div>

						<div class="info-card">
							<h3>Getting Started</h3>
							<ol class="steps-list">
								<li>Check connection status in the top bar</li>
								<li>Navigate using the left sidebar</li>
								<li>Switch to your streaming profile</li>
								<li>Adjust video settings as needed</li>
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
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		background: #0e0e10;
		color: #efeff1;
	}

	/* Main Layout */
	.obs-master-control {
		display: flex;
		height: 100vh;
		width: 100vw;
		background: #0e0e10;
		overflow: hidden;
	}

	/* Left Sidebar */
	.sidebar {
		width: 240px;
		background: #18181b;
		border-right: 1px solid #26262c;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1.5rem 1rem;
		border-bottom: 1px solid #26262c;
	}

	.sidebar-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #efeff1;
		line-height: 1.4;
	}

	.version {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: #adadb8;
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-left: 3px solid transparent;
		color: #adadb8;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.nav-item:hover {
		background: #1f1f23;
		color: #efeff1;
	}

	.nav-item.active {
		background: #1f1f23;
		border-left-color: #9147ff;
		color: #efeff1;
	}

	.nav-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.nav-label {
		flex: 1;
	}

	/* Main Container */
	.main-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #0e0e10;
	}

	/* Top Bar */
	.topbar {
		height: 50px;
		background: #18181b;
		border-bottom: 1px solid #26262c;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		flex-shrink: 0;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.page-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #efeff1;
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #1f1f23;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #adadb8;
	}

	.status-indicator.connected {
		color: #00f593;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #e91916;
	}

	.status-indicator.connected .status-dot {
		background: #00f593;
	}

	.uptime {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #adadb8;
	}

	.uptime-label {
		font-weight: 500;
	}

	.uptime-value {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
		color: #efeff1;
	}

	/* Content Area */
	.content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		background: #0e0e10;
	}

	/* Dashboard Grid */
	.dashboard-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background: #18181b;
		border: 1px solid #26262c;
		border-radius: 0.375rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #adadb8;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #efeff1;
	}

	.stat-value.connected {
		color: #00f593;
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.info-card {
		background: #18181b;
		border: 1px solid #26262c;
		border-radius: 0.375rem;
		padding: 1.5rem;
	}

	.info-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #efeff1;
	}

	.controller-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.controller-item {
		font-size: 0.875rem;
		color: #adadb8;
		padding: 0.375rem 0;
	}

	.steps-list {
		margin: 0;
		padding-left: 1.25rem;
		color: #adadb8;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.steps-list li {
		margin-bottom: 0.5rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.sidebar {
			width: 60px;
		}

		.nav-label {
			display: none;
		}

		.sidebar-title,
		.version {
			display: none;
		}

		.topbar {
			padding: 0 1rem;
		}

		.page-title {
			font-size: 1rem;
		}

		.uptime-label {
			display: none;
		}

		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.info-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
