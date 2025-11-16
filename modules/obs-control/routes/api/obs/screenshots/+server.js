import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	try {
		const context = locals.moduleContext;
		
		if (!context || !context.obs) {
			return json({ error: 'OBS not available' }, { status: 503 });
		}

		const { action, sourceName, imageFormat, imageFilePath, imageWidth, imageHeight, imageCompressionQuality } = await request.json();

		switch (action) {
			case 'save':
				if (!sourceName || !imageFilePath) {
					return json({ error: 'Source name and file path required' }, { status: 400 });
				}
				
				const saveParams = {
					sourceName,
					imageFormat: imageFormat || 'png',
					imageFilePath
				};
				
				if (imageWidth) saveParams.imageWidth = parseInt(imageWidth);
				if (imageHeight) saveParams.imageHeight = parseInt(imageHeight);
				if (imageCompressionQuality !== undefined) {
					saveParams.imageCompressionQuality = parseInt(imageCompressionQuality);
				}
				
				await context.obs.call('SaveSourceScreenshot', saveParams);
				return json({ success: true, message: `Screenshot saved to ${imageFilePath}` });

			case 'get':
				if (!sourceName) {
					return json({ error: 'Source name required' }, { status: 400 });
				}
				
				const getParams = {
					sourceName,
					imageFormat: imageFormat || 'png'
				};
				
				if (imageWidth) getParams.imageWidth = parseInt(imageWidth);
				if (imageHeight) getParams.imageHeight = parseInt(imageHeight);
				if (imageCompressionQuality !== undefined) {
					getParams.imageCompressionQuality = parseInt(imageCompressionQuality);
				}
				
				const response = await context.obs.call('GetSourceScreenshot', getParams);
				return json({ 
					success: true, 
					imageData: response.imageData || '',
					message: 'Screenshot captured'
				});

			default:
				return json({ error: 'Invalid action' }, { status: 400 });
		}

	} catch (error) {
		console.error('Error in screenshots POST:', error);
		return json({ 
			error: error.message || 'Failed to capture screenshot',
			success: false 
		}, { status: 500 });
	}
}
