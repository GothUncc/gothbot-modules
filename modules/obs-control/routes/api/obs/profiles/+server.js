import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/profiles
 * Get list of all OBS profiles and current profile
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		const profiles = await module.ProfileController?.listProfiles?.();
		const current = await module.ProfileController?.getCurrentProfile?.();

		return json({
			profiles: profiles || [],
			current: current || null
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * POST /api/obs/profiles
 * Create a new profile
 */
export async function POST({ request, locals }) {
	try {
		const { profileName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!profileName) {
			return json({ error: 'Profile name is required' }, { status: 400 });
		}

		const result = await module.ProfileController?.createProfile?.(profileName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * PUT /api/obs/profiles
 * Switch to a profile
 */
export async function PUT({ request, locals }) {
	try {
		const { profileName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!profileName) {
			return json({ error: 'Profile name is required' }, { status: 400 });
		}

		const result = await module.ProfileController?.setProfile?.(profileName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * DELETE /api/obs/profiles
 * Delete a profile
 */
export async function DELETE({ request, locals }) {
	try {
		const { profileName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!profileName) {
			return json({ error: 'Profile name is required' }, { status: 400 });
		}

		const result = await module.ProfileController?.deleteProfile?.(profileName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
