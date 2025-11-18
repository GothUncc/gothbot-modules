<script>
	import { createEventDispatcher } from 'svelte';
	export let settings = {};

	const dispatch = createEventDispatcher();

	let localSettings = {
		maxConcurrent: settings.maxConcurrent || 1,
		minDelay: settings.minDelay || 500,
		enableFollowAlerts: settings.enableFollowAlerts !== false,
		enableSubscribeAlerts: settings.enableSubscribeAlerts !== false,
		enableRaidAlerts: settings.enableRaidAlerts !== false,
		enableDonationAlerts: settings.enableDonationAlerts !== false,
		enableCheerAlerts: settings.enableCheerAlerts !== false,
		minRaidViewers: settings.minRaidViewers || 0,
		minDonationAmount: settings.minDonationAmount || 0,
		minCheerBits: settings.minCheerBits || 0,
		deduplication: settings.deduplication !== false,
		pauseDuringBRB: settings.pauseDuringBRB || false,
		autoSkip: settings.autoSkip || false
	};

	async function saveSettings() {
		try {
			const response = await fetch('/api/alerts/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(localSettings)
			});

			if (!response.ok) throw new Error('Failed to save settings');

			alert('Settings saved successfully!');
			dispatch('refresh');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	async function clearQueue() {
		if (!confirm('Clear all pending alerts?')) return;

		try {
			const response = await fetch('/api/alerts/queue/clear', {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Failed to clear queue');

			alert('Queue cleared successfully!');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}
</script>

<div class="max-w-3xl">
	<h2 class="text-xl font-semibold text-gray-800 mb-6">Settings</h2>

	<div class="space-y-6">
		<!-- Queue Management -->
		<div class="bg-gray-50 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-800 mb-4">Queue Management</h3>
			
			<div class="grid grid-cols-2 gap-4 mb-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Alerts</label>
					<input
						type="number"
						bind:value={localSettings.maxConcurrent}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="1"
						max="5"
					/>
					<p class="text-xs text-gray-500 mt-1">How many alerts can display at once</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Delay (ms)</label>
					<input
						type="number"
						bind:value={localSettings.minDelay}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="0"
						max="5000"
						step="100"
					/>
					<p class="text-xs text-gray-500 mt-1">Delay between alerts</p>
				</div>
			</div>

			<button
				class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
				on:click={clearQueue}
			>
				Clear Queue
			</button>
		</div>

		<!-- Event Filters -->
		<div class="bg-gray-50 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-800 mb-4">Event Filters</h3>
			
			<div class="space-y-3">
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.enableFollowAlerts}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enable Follow Alerts</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.enableSubscribeAlerts}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enable Subscribe Alerts</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.enableRaidAlerts}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enable Raid Alerts</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.enableDonationAlerts}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enable Donation Alerts</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.enableCheerAlerts}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enable Cheer Alerts</label>
				</div>
			</div>
		</div>

		<!-- Minimum Thresholds -->
		<div class="bg-gray-50 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-800 mb-4">Minimum Thresholds</h3>
			
			<div class="grid grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Raid Viewers</label>
					<input
						type="number"
						bind:value={localSettings.minRaidViewers}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="0"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Donation Amount</label>
					<input
						type="number"
						bind:value={localSettings.minDonationAmount}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="0"
						step="0.01"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Cheer Bits</label>
					<input
						type="number"
						bind:value={localSettings.minCheerBits}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						min="0"
					/>
				</div>
			</div>
		</div>

		<!-- Alert Behavior -->
		<div class="bg-gray-50 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-800 mb-4">Alert Behavior</h3>
			
			<div class="space-y-3">
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.deduplication}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Deduplication (prevent duplicate alerts)</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.pauseDuringBRB}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Pause during BRB scene</label>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={localSettings.autoSkip}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Auto-skip alerts when stream offline</label>
				</div>
			</div>
		</div>

		<!-- Save Button -->
		<div class="flex justify-end pt-4 border-t">
			<button
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				on:click={saveSettings}
			>
				Save Settings
			</button>
		</div>
	</div>
</div>
