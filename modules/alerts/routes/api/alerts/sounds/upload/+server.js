import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const formData = await request.formData();
	const file = formData.get('sound');
	
	// This will be replaced with actual file upload handling
	return json({ success: true, id: 'sound_' + Date.now() });
}
