import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		const sceneName = url.searchParams.get('sceneName');
		const sceneItemId = url.searchParams.get('sceneItemId');
		
		if (!sceneName || !sceneItemId) {
			return json({ error: 'Scene name and item ID required' }, { status: 400 });
		}

		// Get transform for the scene item
		const response = await context.obs.call('GetSceneItemTransform', { 
			sceneName, 
			sceneItemId: parseInt(sceneItemId) 
		});

		return json({
			success: true,
			transform: response.sceneItemTransform || {}
		});

	} catch (error) {
		console.error('Error fetching transform:', error);
		return json({ 
			error: error.message || 'Failed to fetch transform',
			success: false 
		}, { status: 500 });
	}
}

export async function POST({ request, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		const { sceneName, sceneItemId, transform } = await request.json();

		if (!sceneName || !sceneItemId || !transform) {
			return json({ error: 'Scene name, item ID, and transform required' }, { status: 400 });
		}

		await context.obs.call('SetSceneItemTransform', { 
			sceneName, 
			sceneItemId: parseInt(sceneItemId),
			sceneItemTransform: transform
		});

		return json({ success: true, message: 'Transform updated' });

	} catch (error) {
		console.error('Error in transforms POST:', error);
		return json({ 
			error: error.message || 'Failed to update transform',
			success: false 
		}, { status: 500 });
	}
}
