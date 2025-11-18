<script>
	import { createEventDispatcher } from 'svelte';
	export let templates = [];

	const dispatch = createEventDispatcher();

	let selectedTemplate = null;
	let showEditor = false;
	let testingAlert = false;

	function createNew() {
		selectedTemplate = {
			id: null,
			name: '',
			eventType: 'follow',
			enabled: true,
			templateType: 'html',
			htmlContent: '',
			cssContent: '',
			duration: 5000,
			animation: 'slide-in',
			soundFile: null,
			soundVolume: 0.8
		};
		showEditor = true;
	}

	function editTemplate(template) {
		selectedTemplate = { ...template };
		showEditor = true;
	}

	async function saveTemplate() {
		try {
			const url = selectedTemplate.id
				? `/api/alerts/templates/${selectedTemplate.id}`
				: '/api/alerts/templates';
			const method = selectedTemplate.id ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(selectedTemplate)
			});

			if (!response.ok) throw new Error('Failed to save template');

			showEditor = false;
			selectedTemplate = null;
			dispatch('refresh');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	async function deleteTemplate(templateId) {
		if (!confirm('Are you sure you want to delete this template?')) return;

		try {
			const response = await fetch(`/api/alerts/templates/${templateId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete template');

			dispatch('refresh');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	async function testTemplate(template) {
		testingAlert = true;
		try {
			const response = await fetch(`/api/alerts/test/${template.eventType}`, {
				method: 'POST'
			});

			if (!response.ok) throw new Error('Failed to test alert');

			const result = await response.json();
			alert(result.message || 'Test alert triggered!');
		} catch (error) {
			alert('Error: ' + error.message);
		} finally {
			testingAlert = false;
		}
	}

	function cancel() {
		showEditor = false;
		selectedTemplate = null;
	}
</script>

<div>
	{#if !showEditor}
		<!-- Template Grid -->
		<div class="mb-4 flex justify-between items-center">
			<h2 class="text-xl font-semibold text-gray-800">Alert Templates</h2>
			<button
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				on:click={createNew}
			>
				+ Create New
			</button>
		</div>

		{#if templates.length === 0}
			<div class="text-center py-12 text-gray-500">
				<div class="text-4xl mb-2">📋</div>
				<p>No templates yet. Create your first template to get started!</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each templates as template}
					<div class="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h3 class="font-semibold text-gray-800">{template.name}</h3>
								<span class="text-sm text-gray-500 capitalize">{template.eventType}</span>
							</div>
							<span
								class="px-2 py-1 text-xs rounded-full {template.enabled
									? 'bg-green-100 text-green-700'
									: 'bg-gray-100 text-gray-600'}"
							>
								{template.enabled ? '✓ Enabled' : 'Disabled'}
							</span>
						</div>

						<div class="text-xs text-gray-500 mb-3">
							Duration: {template.duration / 1000}s | Animation: {template.animation}
						</div>

						<div class="flex gap-2">
							<button
								class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
								on:click={() => editTemplate(template)}
							>
								Edit
							</button>
							<button
								class="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
								on:click={() => testTemplate(template)}
								disabled={testingAlert}
							>
								Test
							</button>
							<button
								class="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
								on:click={() => deleteTemplate(template.id)}
							>
								🗑️
							</button>
						</div>

						<div class="mt-3 text-xs text-gray-400">
							Used {template.usageCount || 0} times
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Template Editor -->
		<div class="max-w-4xl mx-auto">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">
				{selectedTemplate.id ? 'Edit Template' : 'Create New Template'}
			</h2>

			<div class="space-y-4">
				<!-- Basic Info -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
						<input
							type="text"
							bind:value={selectedTemplate.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="My Awesome Alert"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
						<select
							bind:value={selectedTemplate.eventType}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="follow">Follow</option>
							<option value="subscribe">Subscribe</option>
							<option value="raid">Raid</option>
							<option value="donation">Donation</option>
							<option value="cheer">Cheer/Bits</option>
						</select>
					</div>
				</div>

				<!-- Display Settings -->
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Duration (ms)</label>
						<input
							type="number"
							bind:value={selectedTemplate.duration}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							min="1000"
							max="30000"
							step="1000"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Animation</label>
						<select
							bind:value={selectedTemplate.animation}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="slide-in">Slide In</option>
							<option value="fade">Fade</option>
							<option value="bounce">Bounce</option>
							<option value="zoom">Zoom</option>
							<option value="confetti">Confetti</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Sound Volume</label>
						<input
							type="number"
							bind:value={selectedTemplate.soundVolume}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							min="0"
							max="1"
							step="0.1"
						/>
					</div>
				</div>

				<!-- HTML Content -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
					<textarea
						bind:value={selectedTemplate.htmlContent}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
						rows="8"
						placeholder="<div>{{displayName}} just followed!</div>"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">
						Available variables: {{username}}, {{displayName}}, {{amount}}, {{message}}, {{tier}},
						{{months}}, {{viewers}}, {{currency}}
					</p>
				</div>

				<!-- CSS Content -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">CSS Content</label>
					<textarea
					bind:value={selectedTemplate.cssContent}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
					rows="6"
					placeholder=".alert &#123; padding: 20px; background: blue; &#125;"
				></textarea>
				</div>

				<!-- Enabled Checkbox -->
				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={selectedTemplate.enabled}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label class="ml-2 text-sm font-medium text-gray-700">Enabled</label>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3 pt-4 border-t">
					<button
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						on:click={cancel}
					>
						Cancel
					</button>
					<button
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						on:click={saveTemplate}
					>
						Save Template
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
