import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/status
 * Get current OBS connection status and streaming info
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({
				error: 'OBS module not available',
				connected: false
			}, { status: 503 });
		}

		const status = await module.getStatus();
		return json(status);
	} catch (error) {
		return json({
			error: error.message,
			connected: false
		}, { status: 500 });
	}
}
