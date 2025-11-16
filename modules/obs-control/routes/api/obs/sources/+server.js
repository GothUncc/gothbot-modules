export async function GET({ locals, url }) {
  try {
    const context = locals.moduleContext;
    if (!context?.obs) {
      return new Response(JSON.stringify({ error: 'OBS API not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sceneName = url.searchParams.get('scene');
    if (!sceneName) {
      return new Response(JSON.stringify({ error: 'Scene name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get scene items (sources)
    const response = await context.obs.call('GetSceneItemList', { sceneName });

    return new Response(JSON.stringify({
      sources: response.sceneItems || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      sources: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, locals }) {
  try {
    const context = locals.moduleContext;
    if (!context?.obs) {
      return new Response(JSON.stringify({ error: 'OBS API not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { action, sceneName, sceneItemId, enabled, locked } = body;

    if (action === 'setVisibility') {
      await context.obs.call('SetSceneItemEnabled', { 
        sceneName, 
        sceneItemId, 
        sceneItemEnabled: enabled 
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'setLocked') {
      await context.obs.call('SetSceneItemLocked', { 
        sceneName, 
        sceneItemId, 
        sceneItemLocked: locked 
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
