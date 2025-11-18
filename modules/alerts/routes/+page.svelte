<script>
	import { onMount } from 'svelte';
	import TemplateEditor from './components/TemplateEditor.svelte';
	import SoundLibrary from './components/SoundLibrary.svelte';
	import AlertHistory from './components/AlertHistory.svelte';
	import SettingsTab from './components/SettingsTab.svelte';

	let activeTab = 'templates';
	let templates = [];
	let sounds = [];
	let history = [];
	let settings = {};
	let queueStatus = { queueLength: 0, processing: false, paused: false };
	let loading = true;
	let error = null;

	const tabs = [
		{ id: 'templates', name: 'Templates', icon: '📋' },
		{ id: 'settings', name: 'Settings', icon: '⚙️' },
		{ id: 'sounds', name: 'Sounds', icon: '🎵' },
		{ id: 'history', name: 'History', icon: '📊' }
	];

	onMount(async () => {
		await loadData();
		// Refresh queue status every 5 seconds
		setInterval(() => {
			loadQueueStatus();
		}, 5000);
	});

	async function loadData() {
		loading = true;
		error = null;
		try {
			await Promise.all([
				loadTemplates(),
				loadSounds(),
				loadHistory(),
				loadSettings(),
				loadQueueStatus()
			]);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function loadTemplates() {
		const response = await fetch('/api/alerts/templates');
		if (!response.ok) throw new Error('Failed to load templates');
		templates = await response.json();
	}

	async function loadSounds() {
		const response = await fetch('/api/alerts/sounds');
		if (!response.ok) throw new Error('Failed to load sounds');
		sounds = await response.json();
	}

	async function loadHistory() {
		const response = await fetch('/api/alerts/history');
		if (!response.ok) throw new Error('Failed to load history');
		history = await response.json();
	}

	async function loadSettings() {
		const response = await fetch('/api/alerts/settings');
		if (!response.ok) throw new Error('Failed to load settings');
		settings = await response.json();
	}

	async function loadQueueStatus() {
		try {
			const response = await fetch('/api/alerts/queue/status');
			if (response.ok) {
				queueStatus = await response.json();
			}
		} catch (err) {
			// Silent fail for queue status
		}
	}

	function changeTab(tabId) {
		activeTab = tabId;
	}
</script>

<div class="container mx-auto px-4 py-6">
	<!-- Header -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-800">🔔 Alert System</h1>
				<p class="text-gray-600 mt-1">Manage templates, sounds, and alert history</p>
			</div>
			<div class="text-right">
				<div class="text-sm text-gray-500">Queue Status</div>
				<div class="flex items-center gap-2 mt-1">
					<span class="text-lg font-semibold">{queueStatus.queueLength} pending</span>
					{#if queueStatus.processing}
						<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Processing</span>
					{/if}
					{#if queueStatus.paused}
						<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Paused</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			<strong>Error:</strong> {error}
		</div>
	{/if}

	{#if loading}
		<div class="bg-white rounded-lg shadow-md p-12 text-center">
			<div class="text-gray-500">Loading...</div>
		</div>
	{:else}
		<!-- Tabs -->
		<div class="bg-white rounded-lg shadow-md mb-6">
			<div class="border-b border-gray-200">
				<nav class="flex -mb-px">
					{#each tabs as tab}
						<button
							class="px-6 py-4 text-sm font-medium transition-colors border-b-2 {activeTab === tab.id
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							on:click={() => changeTab(tab.id)}
						>
							<span class="mr-2">{tab.icon}</span>
							{tab.name}
						</button>
					{/each}
				</nav>
			</div>

			<!-- Tab Content -->
			<div class="p-6">
				{#if activeTab === 'templates'}
					<TemplateEditor {templates} on:refresh={loadTemplates} />
				{:else if activeTab === 'settings'}
					<SettingsTab {settings} on:refresh={loadSettings} />
				{:else if activeTab === 'sounds'}
					<SoundLibrary {sounds} on:refresh={loadSounds} />
				{:else if activeTab === 'history'}
					<AlertHistory {history} on:refresh={loadHistory} />
				{/if}
			</div>
		</div>
	{/if}
</div>
