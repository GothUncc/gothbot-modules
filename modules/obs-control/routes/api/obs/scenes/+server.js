export async function GET({ locals }) {
  try {
    const context = locals.moduleContext;
    if (!context?.obs) {
      return new Response(JSON.stringify({ error: 'OBS API not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get scene list
    const sceneListResponse = await context.obs.call('GetSceneList');
    const currentSceneResponse = await context.obs.call('GetCurrentProgramScene');

    return new Response(JSON.stringify({
      scenes: sceneListResponse.scenes || [],
      currentScene: currentSceneResponse.currentProgramSceneName || sceneListResponse.currentProgramSceneName
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      scenes: [],
      currentScene: null
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
    const { action, sceneName } = body;

    if (action === 'setCurrentScene') {
      await context.obs.call('SetCurrentProgramScene', { sceneName });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'createScene') {
      await context.obs.call('CreateScene', { sceneName });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'removeScene') {
      await context.obs.call('RemoveScene', { sceneName });
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
