<script>
	import { collections, currentCollection } from '../stores/obsStatus.js';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let newCollectionName = '';
	let showCreateForm = false;

	async function switchCollection(collectionName) {
		isLoading = true;
		try {
			sendWebSocketMessage('SetCurrentCollection', { collectionName });
		} catch (err) {
			console.error('Failed to switch collection:', err);
		} finally {
			isLoading = false;
		}
	}

	async function createCollection() {
		if (!newCollectionName.trim()) return;

		isLoading = true;
		try {
			sendWebSocketMessage('CreateCollection', { collectionName: newCollectionName });
			newCollectionName = '';
			showCreateForm = false;
		} catch (err) {
			console.error('Failed to create collection:', err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteCollection(collectionName) {
		if (!confirm(`Delete collection "${collectionName}"?`)) return;

		isLoading = true;
		try {
			sendWebSocketMessage('DeleteCollection', { collectionName });
		} catch (err) {
			console.error('Failed to delete collection:', err);
		} finally {
			isLoading = false;
		}
	}

	async function exportCollection(collectionName) {
		isLoading = true;
		try {
			sendWebSocketMessage('ExportCollection', { collectionName });
		} catch (err) {
			console.error('Failed to export collection:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="collection-switcher">
	<h2>Scene Collections Manager</h2>

	<div class="collections-container">
		<div class="collection-list">
			{#if $collections && $collections.length > 0}
				{#each $collections as collection (collection)}
					<div class="collection-item {collection === $currentCollection ? 'active' : ''}">
						<div class="collection-info">
							<div class="collection-name">{collection}</div>
							<div class="collection-status">
								{#if collection === $currentCollection}
									<span class="status-badge active">Active</span>
								{/if}
							</div>
						</div>
						<div class="collection-actions">
							<button
								class="btn btn-primary"
								on:click={() => switchCollection(collection)}
								disabled={collection === $currentCollection || isLoading}
								title="Switch to this collection"
							>
								{collection === $currentCollection ? '✓ Active' : 'Switch'}
							</button>
							<button
								class="btn btn-secondary"
								on:click={() => exportCollection(collection)}
								disabled={isLoading}
								title="Export collection"
							>
								Export
							</button>
							{#if collection !== $currentCollection}
								<button
									class="btn btn-danger"
									on:click={() => deleteCollection(collection)}
									disabled={isLoading}
									title="Delete collection"
								>
									Delete
								</button>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<p class="empty-state">No collections available</p>
			{/if}
		</div>
	</div>

	<button
		class="btn btn-secondary"
		on:click={() => (showCreateForm = !showCreateForm)}
		disabled={isLoading}
	>
		+ Create New Collection
	</button>

	{#if showCreateForm}
		<div class="create-form">
			<input
				type="text"
				placeholder="Collection name"
				bind:value={newCollectionName}
				disabled={isLoading}
			/>
			<button class="btn btn-primary" on:click={createCollection} disabled={isLoading || !newCollectionName}>
				Create
			</button>
			<button class="btn btn-secondary" on:click={() => (showCreateForm = false)}>
				Cancel
			</button>
		</div>
	{/if}
</div>


<style>
	.collection-switcher {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.collection-switcher h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.collections-container {
		background-color: var(--color-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
		min-height: 200px;
	}

	.collection-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.collection-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: rgba(59, 130, 246, 0.05);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.collection-item:hover {
		background-color: rgba(59, 130, 246, 0.1);
	}

	.collection-item.active {
		border-color: var(--color-success);
		background-color: rgba(16, 185, 129, 0.1);
	}

	.collection-info {
		flex: 1;
	}

	.collection-name {
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.collection-status {
		display: flex;
		gap: 0.5rem;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background-color: rgba(59, 130, 246, 0.2);
		color: var(--color-accent);
	}

	.status-badge.active {
		background-color: rgba(16, 185, 129, 0.2);
		color: var(--color-success);
	}

	.collection-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.empty-state {
		color: var(--color-text-muted);
		text-align: center;
		margin: 2rem 0;
	}

	.create-form {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background-color: var(--color-secondary);
		border-radius: 0.5rem;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		min-width: 200px;
		padding: 0.5rem;
		background-color: var(--color-primary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
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

	.btn-danger {
		background-color: var(--color-error);
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #dc2626;
	}

	@media (max-width: 768px) {
		.collection-item {
			flex-direction: column;
			align-items: flex-start;
		}

		.collection-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.btn {
			flex: 1;
			min-width: 100px;
		}
	}
</style>
