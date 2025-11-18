import { json } from '@sveltejs/kit';

export async function GET() {
	// This will be replaced with actual module API calls
	return json({
		queueLength: 0,
		processing: false,
		paused: false
	});
}
