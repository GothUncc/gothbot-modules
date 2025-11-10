import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/replay-buffer
 * Get replay buffer status and info
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		const status = await module.ReplayBufferController?.getStatus?.();
		const bufferStatus = await module.ReplayBufferController?.getBufferStatus?.();
		const maxSeconds = await module.ReplayBufferController?.getMaxSeconds?.();

		return json({
			active: status?.active || false,
			bufferStatus: bufferStatus,
			maxDurationSeconds: maxSeconds || 300
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * POST /api/obs/replay-buffer
 * Control replay buffer (start, stop, save)
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
				result = await module.ReplayBufferController?.start?.();
				break;

			case 'stop':
				result = await module.ReplayBufferController?.stop?.();
				break;

			case 'toggle':
				result = await module.ReplayBufferController?.toggle?.();
				break;

			case 'save':
				result = await module.ReplayBufferController?.save?.();
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
 * PUT /api/obs/replay-buffer
 * Configure replay buffer settings
 */
export async function PUT({ request, locals }) {
	try {
		const { maxSeconds } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!maxSeconds || maxSeconds < 5 || maxSeconds > 3600) {
			return json({
				error: 'Duration must be between 5 and 3600 seconds'
			}, { status: 400 });
		}

		const result = await module.ReplayBufferController?.setMaxSeconds?.(maxSeconds);

		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
