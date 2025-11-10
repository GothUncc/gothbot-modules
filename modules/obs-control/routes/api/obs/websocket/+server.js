/**
 * WebSocket API Endpoint
 * 
 * Handles WebSocket connections for real-time updates
 * Automatically upgraded from HTTP to WebSocket protocol
 * 
 * Usage:
 * Client connects to: ws://localhost:5173/api/obs/websocket
 * 
 * Message Format:
 * {
 *   type: 'MessageType',
 *   data: { ... }
 * }
 */

export async function GET({ request, locals }) {
	// Get WebSocket from request headers
	const upgrade = request.headers.get('upgrade');

	// Only handle WebSocket upgrades
	if (upgrade !== 'websocket') {
		return new Response('Expected WebSocket', { status: 400 });
	}

	// The actual WebSocket upgrade is handled by the SvelteKit adapter
	// and processed through the handle hook in hooks.server.js
	// This endpoint just validates the upgrade request

	return new Response('WebSocket upgrade started', { status: 101 });
}
