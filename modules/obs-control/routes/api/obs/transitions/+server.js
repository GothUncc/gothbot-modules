import { json } from '@sveltejs/kit';

export async function GET({ request, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		// Get list of available transitions
		const transitionsResponse = await context.obs.call('GetSceneTransitionList');
		
		// Get current transition
		const currentResponse = await context.obs.call('GetCurrentSceneTransition');

		return json({
			success: true,
			transitions: transitionsResponse.transitions || [],
			currentTransition: currentResponse.transitionName || '',
			currentDuration: currentResponse.transitionDuration || 300
		});

	} catch (error) {
		console.error('Error fetching transitions:', error);
		return json({ 
			error: error.message || 'Failed to fetch transitions',
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

		const { action, transitionName, duration } = await request.json();

		switch (action) {
			case 'setTransition':
				if (!transitionName) {
					return json({ error: 'Transition name required' }, { status: 400 });
				}
				await context.obs.call('SetCurrentSceneTransition', { transitionName });
				return json({ success: true, message: `Transition set to ${transitionName}` });

			case 'setDuration':
				if (duration === undefined) {
					return json({ error: 'Duration required' }, { status: 400 });
				}
				await context.obs.call('SetCurrentSceneTransitionDuration', { 
					transitionDuration: parseInt(duration) 
				});
				return json({ success: true, message: `Duration set to ${duration}ms` });

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

	} catch (error) {
		console.error('Error in transitions POST:', error);
		return json({ 
			error: error.message || 'Failed to update transition',
			success: false 
		}, { status: 500 });
	}
}
