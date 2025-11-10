import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/video-settings
 * Get current video settings (resolution, FPS, format)
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		const baseRes = await module.VideoSettingsController?.getBaseResolution?.();
		const scaledRes = await module.VideoSettingsController?.getScaledResolution?.();
		const fps = await module.VideoSettingsController?.getFrameRate?.();
		const format = await module.VideoSettingsController?.getFormat?.();
		const presets = await module.VideoSettingsController?.getResolutionPresets?.();

		return json({
			baseResolution: baseRes,
			scaledResolution: scaledRes,
			frameRate: fps,
			videoFormat: format,
			presets: presets || []
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * PUT /api/obs/video-settings
 * Update video settings
 */
export async function PUT({ request, locals }) {
	try {
		const { setting, value } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		let result;

		switch (setting) {
			case 'baseResolution':
				result = await module.VideoSettingsController?.setBaseResolution?.(
					value.width,
					value.height
				);
				break;

			case 'scaledResolution':
				result = await module.VideoSettingsController?.setScaledResolution?.(
					value.width,
					value.height
				);
				break;

			case 'frameRate':
				result = await module.VideoSettingsController?.setFrameRate?.(value);
				break;

			case 'videoFormat':
				result = await module.VideoSettingsController?.setFormat?.(value);
				break;

			case 'preset':
				result = await module.VideoSettingsController?.applyPreset?.(value, 'base');
				break;

			default:
				return json({ error: 'Unknown setting' }, { status: 400 });
		}

		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
