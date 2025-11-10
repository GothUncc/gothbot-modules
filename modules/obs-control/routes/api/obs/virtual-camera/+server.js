import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/virtual-camera
 * Get virtual camera status
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		const status = await module.VirtualCamController?.getStatus?.();
		const formats = await module.VirtualCamController?.listAvailableFormats?.();

		return json({
			active: status?.active || false,
			outputFormat: status?.outputFormat || 'UYVY',
			availableFormats: formats || ['UYVY', 'NV12', 'I420', 'XRGB', 'ARGB']
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * POST /api/obs/virtual-camera
 * Control virtual camera (start, stop, toggle)
 */
export async function POST({ request, locals }) {
	try {
		const { action } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		let result;

		switch (action) {
			case 'start':
				result = await module.VirtualCamController?.start?.();
				break;

			case 'stop':
				result = await module.VirtualCamController?.stop?.();
				break;

			case 'toggle':
				result = await module.VirtualCamController?.toggle?.();
				break;

			default:
				return json({ error: 'Unknown action' }, { status: 400 });
		}

		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * PUT /api/obs/virtual-camera
 * Set virtual camera format
 */
export async function PUT({ request, locals }) {
	try {
		const { format } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!format) {
			return json({ error: 'Format is required' }, { status: 400 });
		}

		const result = await module.VirtualCamController?.setOutputFormat?.(format);

		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
