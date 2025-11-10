import { json } from '@sveltejs/kit';

/**
 * GET /api/obs/collections
 * Get list of all scene collections and current collection
 */
export async function GET({ locals }) {
	try {
		const module = locals.moduleContext?.obs;
		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		const collections = await module.SceneCollectionController?.listCollections?.();
		const current = await module.SceneCollectionController?.getCurrentCollection?.();

		return json({
			collections: collections || [],
			current: current || null
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * POST /api/obs/collections
 * Create a new scene collection
 */
export async function POST({ request, locals }) {
	try {
		const { collectionName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!collectionName) {
			return json({ error: 'Collection name is required' }, { status: 400 });
		}

		const result = await module.SceneCollectionController?.createCollection?.(collectionName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * PUT /api/obs/collections
 * Switch to a scene collection
 */
export async function PUT({ request, locals }) {
	try {
		const { collectionName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!collectionName) {
			return json({ error: 'Collection name is required' }, { status: 400 });
		}

		const result = await module.SceneCollectionController?.setCollection?.(collectionName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/**
 * DELETE /api/obs/collections
 * Delete a scene collection
 */
export async function DELETE({ request, locals }) {
	try {
		const { collectionName } = await request.json();
		const module = locals.moduleContext?.obs;

		if (!module) {
			return json({ error: 'OBS module not available' }, { status: 503 });
		}

		if (!collectionName) {
			return json({ error: 'Collection name is required' }, { status: 400 });
		}

		const result = await module.SceneCollectionController?.deleteCollection?.(collectionName);
		return json({
			success: true,
			result: result
		});
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
