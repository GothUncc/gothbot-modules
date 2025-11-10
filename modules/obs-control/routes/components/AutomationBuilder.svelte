<script>
	import { writable } from 'svelte/store';
	import { sendWebSocketMessage } from '../lib/websocket.js';

	let automations = writable([]);
	let isLoading = false;
	let showNewForm = false;

	let newRule = {
		name: '',
		trigger: 'time',
		action: 'start-stream',
		enabled: true,
		triggerValue: ''
	};

	const triggers = [
		{ id: 'time', label: 'Time Based', description: 'Run at specific time' },
		{ id: 'event', label: 'Event Based', description: 'Run on OBS event' },
		{ id: 'manual', label: 'Manual', description: 'Run on demand' }
	];

	const actions = [
		{ id: 'start-stream', label: 'Start Stream' },
		{ id: 'stop-stream', label: 'Stop Stream' },
		{ id: 'start-record', label: 'Start Recording' },
		{ id: 'stop-record', label: 'Stop Recording' },
		{ id: 'switch-scene', label: 'Switch Scene' },
		{ id: 'switch-profile', label: 'Switch Profile' },
		{ id: 'start-replay', label: 'Start Replay Buffer' },
		{ id: 'save-replay', label: 'Save Replay Buffer' }
	];

	async function createRule() {
		if (!newRule.name.trim()) return;

		isLoading = true;
		try {
			sendWebSocketMessage('CreateAutomation', {
				name: newRule.name,
				trigger: newRule.trigger,
				action: newRule.action,
				enabled: newRule.enabled,
				triggerValue: newRule.triggerValue
			});

			// Reset form
			newRule = {
				name: '',
				trigger: 'time',
				action: 'start-stream',
				enabled: true,
				triggerValue: ''
			};
			showNewForm = false;
		} catch (err) {
			console.error('Failed to create automation:', err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteRule(ruleId) {
		if (!confirm('Delete this automation?')) return;

		isLoading = true;
		try {
			sendWebSocketMessage('DeleteAutomation', { id: ruleId });
		} catch (err) {
			console.error('Failed to delete automation:', err);
		} finally {
			isLoading = false;
		}
	}

	async function toggleRule(ruleId, enabled) {
		isLoading = true;
		try {
			sendWebSocketMessage('UpdateAutomation', { id: ruleId, enabled: !enabled });
		} catch (err) {
			console.error('Failed to update automation:', err);
		} finally {
			isLoading = false;
		}
	}

	async function executeRule(ruleId) {
		isLoading = true;
		try {
			sendWebSocketMessage('ExecuteAutomation', { id: ruleId });
		} catch (err) {
			console.error('Failed to execute automation:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="automation-builder">
	<h2>⚙️ Automation Rules Manager</h2>

	<button
		class="btn btn-secondary"
		on:click={() => (showNewForm = !showNewForm)}
		disabled={isLoading}
	>
		+ Create New Automation
	</button>

	{#if showNewForm}
		<div class="rule-form">
			<h3>Create Automation Rule</h3>

			<div class="form-group">
				<label for="rule-name">Rule Name</label>
				<input
					id="rule-name"
					type="text"
					placeholder="e.g., Auto Stream at 8pm"
					bind:value={newRule.name}
					disabled={isLoading}
				/>
			</div>

			<div class="form-group">
				<label for="rule-trigger">Trigger Type</label>
				<select bind:value={newRule.trigger} disabled={isLoading}>
					{#each triggers as trigger}
						<option value={trigger.id}>{trigger.label} - {trigger.description}</option>
					{/each}
				</select>
			</div>

			{#if newRule.trigger === 'time'}
				<div class="form-group">
					<label for="trigger-time">Time (HH:MM)</label>
					<input
						id="trigger-time"
						type="time"
						bind:value={newRule.triggerValue}
						disabled={isLoading}
					/>
				</div>
			{:else if newRule.trigger === 'event'}
				<div class="form-group">
					<label for="trigger-event">OBS Event</label>
					<select bind:value={newRule.triggerValue} disabled={isLoading}>
						<option value="">Select event</option>
						<option value="stream-started">Stream Started</option>
						<option value="stream-stopped">Stream Stopped</option>
						<option value="recording-started">Recording Started</option>
						<option value="recording-stopped">Recording Stopped</option>
						<option value="scene-changed">Scene Changed</option>
					</select>
				</div>
			{/if}

			<div class="form-group">
				<label for="rule-action">Action to Perform</label>
				<select bind:value={newRule.action} disabled={isLoading}>
					{#each actions as action}
						<option value={action.id}>{action.label}</option>
					{/each}
				</select>
			</div>

			<div class="form-group checkbox">
				<input
					type="checkbox"
					id="rule-enabled"
					bind:checked={newRule.enabled}
					disabled={isLoading}
				/>
				<label for="rule-enabled">Enable Automation</label>
			</div>

			<div class="form-actions">
				<button class="btn btn-primary" on:click={createRule} disabled={isLoading || !newRule.name}>
					Create Automation
				</button>
				<button class="btn btn-secondary" on:click={() => (showNewForm = false)}>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Rules List -->
	<div class="rules-list">
		{#if $automations && $automations.length > 0}
			<h3>Active Automations ({$automations.length})</h3>
			{#each $automations as rule (rule.id)}
				<div class="rule-item {rule.enabled ? 'enabled' : 'disabled'}">
					<div class="rule-header">
						<div class="rule-info">
							<h4>{rule.name}</h4>
							<div class="rule-details">
								<span class="trigger-badge">{rule.trigger}</span>
								<span class="arrow">→</span>
								<span class="action-badge">{rule.action}</span>
							</div>
						</div>
						<div class="rule-status">
							<span class="status-badge {rule.enabled ? 'active' : 'inactive'}">
								{rule.enabled ? 'Active' : 'Inactive'}
							</span>
						</div>
					</div>

					<div class="rule-actions">
						<button
							class="btn btn-small {rule.enabled ? 'btn-disable' : 'btn-enable'}"
							on:click={() => toggleRule(rule.id, rule.enabled)}
							disabled={isLoading}
						>
							{rule.enabled ? '⏸ Disable' : '▶ Enable'}
						</button>

						<button
							class="btn btn-small btn-run"
							on:click={() => executeRule(rule.id)}
							disabled={isLoading}
							title="Run this automation immediately"
						>
							▶ Run
						</button>

						<button
							class="btn btn-small btn-delete"
							on:click={() => deleteRule(rule.id)}
							disabled={isLoading}
						>
							🗑 Delete
						</button>
					</div>
				</div>
			{/each}
		{:else}
			<div class="empty-state">
				<p>No automations created yet</p>
				<p class="empty-hint">Create your first automation above!</p>
			</div>
		{/if}
	</div>

	<!-- Info Card -->
	<div class="info-card">
		<h4>💡 How Automations Work</h4>
		<ul>
			<li><strong>Time-Based:</strong> Triggers at a specific time each day</li>
			<li><strong>Event-Based:</strong> Triggers when an OBS event occurs</li>
			<li><strong>Manual:</strong> Triggers when you click the Run button</li>
			<li>Use automations to streamline your workflow</li>
			<li>Enable/disable automations without deleting them</li>
		</ul>
	</div>
</div>


<style>
	.automation-builder {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.automation-builder h2 {
		margin: 0;
		color: var(--color-accent);
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

	.btn-secondary {
		background-color: var(--color-secondary);
		color: var(--color-text);
		border: 1px solid rgba(59, 130, 246, 0.2);
		padding: 0.75rem 1rem;
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-primary);
	}

	.rule-form {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.rule-form h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: var(--color-accent);
	}

	.form-group {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group select {
		padding: 0.5rem;
		background-color: var(--color-primary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.375rem;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	.form-group.checkbox {
		flex-direction: row;
		align-items: center;
	}

	.form-group.checkbox input {
		width: auto;
		margin: 0;
	}

	.form-group.checkbox label {
		margin: 0;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-primary {
		flex: 1;
		background-color: var(--color-accent);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.rules-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.rules-list h3 {
		margin: 0;
		color: var(--color-accent);
		font-size: 1rem;
	}

	.rule-item {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.rule-item.enabled {
		border-color: rgba(16, 185, 129, 0.3);
		background-color: rgba(16, 185, 129, 0.05);
	}

	.rule-item.disabled {
		opacity: 0.6;
	}

	.rule-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.rule-info h4 {
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
		font-size: 1rem;
	}

	.rule-details {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.trigger-badge,
	.action-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		background-color: rgba(59, 130, 246, 0.2);
		color: var(--color-accent);
	}

	.arrow {
		color: var(--color-text-muted);
		font-weight: bold;
	}

	.rule-status {
		display: flex;
		align-items: center;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-badge.active {
		background-color: rgba(16, 185, 129, 0.2);
		color: var(--color-success);
	}

	.status-badge.inactive {
		background-color: rgba(107, 114, 128, 0.2);
		color: var(--color-text-muted);
	}

	.rule-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.btn-small {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	.btn-enable {
		background-color: var(--color-success);
		color: white;
	}

	.btn-enable:hover:not(:disabled) {
		background-color: #059669;
	}

	.btn-disable {
		background-color: var(--color-warning);
		color: white;
	}

	.btn-disable:hover:not(:disabled) {
		background-color: #d97706;
	}

	.btn-run {
		background-color: var(--color-accent);
		color: white;
	}

	.btn-run:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.btn-delete {
		background-color: var(--color-error);
		color: white;
	}

	.btn-delete:hover:not(:disabled) {
		background-color: #dc2626;
	}

	.empty-state {
		background-color: var(--color-secondary);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 2rem;
		text-align: center;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-muted);
	}

	.empty-hint {
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.info-card {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.info-card h4 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: var(--color-accent);
	}

	.info-card ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style: disc;
	}

	.info-card li {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.rule-header {
			flex-direction: column;
		}

		.rule-actions {
			justify-content: flex-start;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn-primary {
			width: 100%;
		}
	}
</style>
