<script>
	import { createEventDispatcher } from 'svelte';
	export let history = [];

	const dispatch = createEventDispatcher();

	let filterType = 'all';
	let searchQuery = '';

	$: filteredHistory = history
		.filter((item) => {
			if (filterType !== 'all' && item.eventType !== filterType) return false;
			if (searchQuery && !item.eventData?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			return true;
		})
		.sort((a, b) => new Date(b.displayedAt) - new Date(a.displayedAt));

	$: stats = {
		total: history.length,
		follow: history.filter((h) => h.eventType === 'follow').length,
		subscribe: history.filter((h) => h.eventType === 'subscribe').length,
		raid: history.filter((h) => h.eventType === 'raid').length,
		donation: history.filter((h) => h.eventType === 'donation').length,
		cheer: history.filter((h) => h.eventType === 'cheer').length
	};

	async function replayAlert(alert) {
		if (!confirm('Replay this alert?')) return;

		try {
			const response = await fetch(`/api/alerts/history/${alert.id}/replay`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Failed to replay alert');

			alert('Alert replayed!');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	async function clearHistory() {
		if (!confirm('Clear all alert history? This cannot be undone.')) return;

		try {
			const response = await fetch('/api/alerts/history', {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to clear history');

			dispatch('refresh');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	async function exportToCSV() {
		try {
			const response = await fetch('/api/alerts/history/export');
			if (!response.ok) throw new Error('Failed to export history');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `alert-history-${Date.now()}.csv`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	}

	function getEventIcon(type) {
		const icons = {
			follow: '👤',
			subscribe: '⭐',
			raid: '🎯',
			donation: '💰',
			cheer: '🎉'
		};
		return icons[type] || '📢';
	}
</script>

<div>
	<div class="mb-6 flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-800">Alert History</h2>
		<div class="flex gap-2">
			<button
				class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
				on:click={exportToCSV}
			>
				Export CSV
			</button>
			<button
				class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
				on:click={clearHistory}
			>
				Clear History
			</button>
		</div>
	</div>

	<!-- Statistics -->
	<div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
		<div class="bg-gray-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-gray-800">{stats.total}</div>
			<div class="text-sm text-gray-600">Total</div>
		</div>
		<div class="bg-purple-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-purple-700">{stats.follow}</div>
			<div class="text-sm text-gray-600">Follows</div>
		</div>
		<div class="bg-pink-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-pink-700">{stats.subscribe}</div>
			<div class="text-sm text-gray-600">Subs</div>
		</div>
		<div class="bg-yellow-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-yellow-700">{stats.raid}</div>
			<div class="text-sm text-gray-600">Raids</div>
		</div>
		<div class="bg-blue-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-blue-700">{stats.donation}</div>
			<div class="text-sm text-gray-600">Donations</div>
		</div>
		<div class="bg-green-50 rounded-lg p-4 text-center">
			<div class="text-2xl font-bold text-green-700">{stats.cheer}</div>
			<div class="text-sm text-gray-600">Cheers</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex gap-4">
		<div class="flex-1">
			<input
				type="text"
				bind:value={searchQuery}
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				placeholder="Search by username..."
			/>
		</div>
		<select
			bind:value={filterType}
			class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		>
			<option value="all">All Types</option>
			<option value="follow">Follow</option>
			<option value="subscribe">Subscribe</option>
			<option value="raid">Raid</option>
			<option value="donation">Donation</option>
			<option value="cheer">Cheer</option>
		</select>
	</div>

	<!-- History List -->
	{#if filteredHistory.length === 0}
		<div class="text-center py-12 text-gray-500">
			<div class="text-4xl mb-2">📊</div>
			<p>
				{history.length === 0
					? 'No alerts displayed yet. Start streaming to see your alerts here!'
					: 'No alerts match your filters.'}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filteredHistory as alert}
				<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{getEventIcon(alert.eventType)}</span>
							<div>
								<div class="font-semibold text-gray-800">
									{alert.eventData?.displayName || alert.eventData?.username || 'Unknown'}
								</div>
								<div class="text-sm text-gray-500">
									<span class="capitalize">{alert.eventType}</span>
									{#if alert.eventData?.amount}
										• ${alert.eventData.amount}
									{/if}
									{#if alert.eventData?.viewers}
										• {alert.eventData.viewers} viewers
									{/if}
									{#if alert.eventData?.tier}
										• Tier {alert.eventData.tier}
									{/if}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm text-gray-500">{formatDate(alert.displayedAt)}</div>
							<button
								class="mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
								on:click={() => replayAlert(alert)}
							>
								Replay
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
