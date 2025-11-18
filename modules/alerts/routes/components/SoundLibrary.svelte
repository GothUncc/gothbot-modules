<script>
	import { createEventDispatcher } from 'svelte';
	export let sounds = [];

	const dispatch = createEventDispatcher();

	let uploadingFile = false;

	async function uploadSound(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file
		const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
		if (!validTypes.includes(file.type)) {
			alert('Invalid file type. Please upload MP3, WAV, OGG, or M4A files.');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			alert('File too large. Maximum size is 5MB.');
			return;
		}

		uploadingFile = true;

		try {
			const formData = new FormData();
			formData.append('sound', file);

			const response = await fetch('/api/alerts/sounds/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('Failed to upload sound');

			dispatch('refresh');
			event.target.value = ''; // Reset file input
		} catch (error) {
			alert('Error: ' + error.message);
		} finally {
			uploadingFile = false;
		}
	}

	async function deleteSound(soundId) {
		if (!confirm('Are you sure you want to delete this sound?')) return;

		try {
			const response = await fetch(`/api/alerts/sounds/${soundId}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete sound');

			dispatch('refresh');
		} catch (error) {
			alert('Error: ' + error.message);
		}
	}

	function playSound(sound) {
		const audio = new Audio(sound.url || `/modules/alerts/media/sounds/${sound.fileName}`);
		audio.volume = sound.defaultVolume || 0.8;
		audio.play().catch((error) => {
			console.error('Failed to play sound:', error);
		});
	}

	function formatFileSize(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDuration(seconds) {
		if (!seconds) return 'N/A';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
	}
</script>

<div>
	<div class="mb-4 flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-800">Sound Library</h2>
		<label
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
		>
			{uploadingFile ? 'Uploading...' : '+ Upload Sound'}
			<input
				type="file"
				accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
				class="hidden"
				on:change={uploadSound}
				disabled={uploadingFile}
			/>
		</label>
	</div>

	<div class="text-sm text-gray-600 mb-4">
		Supported formats: MP3, WAV, OGG, M4A | Max size: 5MB
	</div>

	{#if sounds.length === 0}
		<div class="text-center py-12 text-gray-500">
			<div class="text-4xl mb-2">🎵</div>
			<p>No sounds uploaded yet. Upload your first sound file to get started!</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each sounds as sound}
				<div class="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
					<div class="flex justify-between items-start mb-3">
						<div class="flex-1">
							<h3 class="font-semibold text-gray-800">{sound.name}</h3>
							<p class="text-sm text-gray-500">{sound.fileName}</p>
						</div>
						<button
							class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
							on:click={() => deleteSound(sound.id)}
						>
							🗑️
						</button>
					</div>

					<div class="text-xs text-gray-500 mb-3 space-y-1">
						<div>Format: {sound.format?.toUpperCase() || 'Unknown'}</div>
						<div>Size: {formatFileSize(sound.fileSize || 0)}</div>
						<div>Duration: {formatDuration(sound.duration)}</div>
						<div>Used: {sound.usageCount || 0} times</div>
					</div>

					<button
						class="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
						on:click={() => playSound(sound)}
					>
						▶️ Preview
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
