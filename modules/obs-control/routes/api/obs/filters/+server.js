import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		const sourceName = url.searchParams.get('sourceName');
		
		if (!sourceName) {
			return json({ error: 'Source name required' }, { status: 400 });
		}

		// Get filters for the source
		const response = await context.obs.call('GetSourceFilterList', { sourceName });

		return json({
			success: true,
			filters: response.filters || []
		});

	} catch (error) {
		console.error('Error fetching filters:', error);
		return json({ 
			error: error.message || 'Failed to fetch filters',
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

		const { action, sourceName, filterName, filterKind, filterSettings, enabled } = await request.json();

		switch (action) {
			case 'create':
				if (!sourceName || !filterName || !filterKind) {
					return json({ error: 'Source name, filter name, and filter kind required' }, { status: 400 });
				}
				await context.obs.call('CreateSourceFilter', { 
					sourceName, 
					filterName,
					filterKind,
					filterSettings: filterSettings || {}
				});
				return json({ success: true, message: `Filter ${filterName} created` });

			case 'remove':
				if (!sourceName || !filterName) {
					return json({ error: 'Source name and filter name required' }, { status: 400 });
				}
				await context.obs.call('RemoveSourceFilter', { sourceName, filterName });
				return json({ success: true, message: `Filter ${filterName} removed` });

			case 'setEnabled':
				if (!sourceName || !filterName || enabled === undefined) {
					return json({ error: 'Source name, filter name, and enabled status required' }, { status: 400 });
				}
				await context.obs.call('SetSourceFilterEnabled', { 
					sourceName, 
					filterName, 
					filterEnabled: enabled 
				});
				return json({ success: true, message: `Filter ${filterName} ${enabled ? 'enabled' : 'disabled'}` });

			case 'setSettings':
				if (!sourceName || !filterName || !filterSettings) {
					return json({ error: 'Source name, filter name, and settings required' }, { status: 400 });
				}
				await context.obs.call('SetSourceFilterSettings', { 
					sourceName, 
					filterName, 
					filterSettings 
				});
				return json({ success: true, message: `Filter ${filterName} settings updated` });

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

	} catch (error) {
		console.error('Error in filters POST:', error);
		return json({ 
			error: error.message || 'Failed to update filter',
			success: false 
		}, { status: 500 });
	}
}
