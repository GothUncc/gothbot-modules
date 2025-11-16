import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		const inputName = url.searchParams.get('inputName');
		
		if (!inputName) {
			return json({ error: 'Input name required' }, { status: 400 });
		}

		// Get input settings
		const response = await context.obs.call('GetInputSettings', { inputName });

		return json({
			success: true,
			settings: response.inputSettings || {},
			kind: response.inputKind || ''
		});

	} catch (error) {
		console.error('Error fetching input settings:', error);
		return json({ 
			error: error.message || 'Failed to fetch input settings',
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

		const { action, sceneName, inputName, inputKind, inputSettings, newName } = await request.json();

		switch (action) {
			case 'create':
				if (!sceneName || !inputName || !inputKind) {
					return json({ error: 'Scene name, input name, and input kind required' }, { status: 400 });
				}
				await context.obs.call('CreateInput', { 
					sceneName,
					inputName,
					inputKind,
					inputSettings: inputSettings || {},
					sceneItemEnabled: true
				});
				return json({ success: true, message: `Input ${inputName} created` });

			case 'remove':
				if (!inputName) {
					return json({ error: 'Input name required' }, { status: 400 });
				}
				await context.obs.call('RemoveInput', { inputName });
				return json({ success: true, message: `Input ${inputName} removed` });

			case 'setSettings':
				if (!inputName || !inputSettings) {
					return json({ error: 'Input name and settings required' }, { status: 400 });
				}
				await context.obs.call('SetInputSettings', { 
					inputName, 
					inputSettings 
				});
				return json({ success: true, message: `Input ${inputName} settings updated` });

			case 'rename':
				if (!inputName || !newName) {
					return json({ error: 'Input name and new name required' }, { status: 400 });
				}
				await context.obs.call('SetInputName', { 
					inputName, 
					newInputName: newName 
				});
				return json({ success: true, message: `Input renamed to ${newName}` });

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

	} catch (error) {
		console.error('Error in inputs POST:', error);
		return json({ 
			error: error.message || 'Failed to update input',
			success: false 
		}, { status: 500 });
	}
}
