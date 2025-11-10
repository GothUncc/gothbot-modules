<script>
	export let tabs = [];
	export let activeTab = 'status';

	function handleTabClick(tabId) {
		activeTab = tabId;
	}
</script>

<nav class="tabs-container">
	<div class="tabs-list">
		{#each tabs as tab (tab.id)}
			<button
				class="tab-button {activeTab === tab.id ? 'active' : ''}"
				on:click={() => handleTabClick(tab.id)}
				aria-selected={activeTab === tab.id}
				role="tab"
			>
				<span class="tab-icon">{tab.icon}</span>
				<span class="tab-label">{tab.label}</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	.tabs-container {
		background-color: var(--color-secondary);
		border-bottom: 1px solid rgba(59, 130, 246, 0.2);
		overflow-x: auto;
		overflow-y: hidden;
	}

	.tabs-list {
		display: flex;
		gap: 0;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.tab-button {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.tab-button:hover {
		color: var(--color-text);
		background-color: rgba(59, 130, 246, 0.05);
	}

	.tab-button.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
		background-color: rgba(59, 130, 246, 0.1);
	}

	.tab-icon {
		font-size: 1.1rem;
	}

	.tab-label {
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.tab-button {
			padding: 0.75rem 1rem;
			font-size: 0.75rem;
		}

		.tab-label {
			display: none;
		}

		.tab-icon {
			font-size: 1rem;
		}
	}
</style>
