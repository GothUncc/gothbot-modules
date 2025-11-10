<script>
	import { profiles, currentProfile } from '../stores/obsStatus.js';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let isLoading = false;
	let newProfileName = '';
	let showCreateForm = false;

	async function switchProfile(profileName) {
		isLoading = true;
		try {
			sendWebSocketMessage('SetCurrentProfile', { profileName });
		} catch (err) {
			console.error('Failed to switch profile:', err);
		} finally {
			isLoading = false;
		}
	}

	async function createProfile() {
		if (!newProfileName.trim()) return;

		isLoading = true;
		try {
			sendWebSocketMessage('CreateProfile', { profileName: newProfileName });
			newProfileName = '';
			showCreateForm = false;
		} catch (err) {
			console.error('Failed to create profile:', err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteProfile(profileName) {
		if (!confirm(`Delete profile "${profileName}"?`)) return;

		isLoading = true;
		try {
			sendWebSocketMessage('DeleteProfile', { profileName });
		} catch (err) {
			console.error('Failed to delete profile:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="profile-switcher">
	<h2>Profile Manager</h2>

	<div class="profiles-container">
		<div class="profile-list">
			{#if $profiles && $profiles.length > 0}
				{#each $profiles as profile (profile)}
					<div class="profile-item {profile === $currentProfile ? 'active' : ''}">
						<div class="profile-name">{profile}</div>
						<div class="profile-actions">
							<button
								class="btn btn-primary"
								on:click={() => switchProfile(profile)}
								disabled={profile === $currentProfile || isLoading}
							>
								{profile === $currentProfile ? '✓ Active' : 'Switch'}
							</button>
							{#if profile !== $currentProfile}
								<button
									class="btn btn-danger"
									on:click={() => deleteProfile(profile)}
									disabled={isLoading}
								>
									Delete
								</button>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<p class="empty-state">No profiles available</p>
			{/if}
		</div>
	</div>

	<button
		class="btn btn-secondary"
		on:click={() => (showCreateForm = !showCreateForm)}
		disabled={isLoading}
	>
		+ Create New Profile
	</button>

	{#if showCreateForm}
		<div class="create-form">
			<input
				type="text"
				placeholder="Profile name"
				bind:value={newProfileName}
				disabled={isLoading}
			/>
			<button class="btn btn-primary" on:click={createProfile} disabled={isLoading || !newProfileName}>
				Create
			</button>
			<button class="btn btn-secondary" on:click={() => (showCreateForm = false)}>
				Cancel
			</button>
		</div>
	{/if}
</div>

<style>
	.profile-switcher {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.profile-switcher h2 {
		margin: 0;
		color: var(--color-accent);
	}

	.profiles-container {
		background-color: var(--color-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
		min-height: 200px;
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.profile-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background-color: rgba(59, 130, 246, 0.05);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.profile-item:hover {
		background-color: rgba(59, 130, 246, 0.1);
	}

	.profile-item.active {
		border-color: var(--color-success);
		background-color: rgba(16, 185, 129, 0.1);
	}

	.profile-name {
		font-weight: 600;
		color: var(--color-text);
	}

	.profile-actions {
		display: flex;
		gap: 0.75rem;
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
	}

	input {
		flex: 1;
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
</style>
