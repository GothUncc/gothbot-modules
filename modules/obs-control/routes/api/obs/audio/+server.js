export async function GET({ locals }) {
  try {
    const context = locals.moduleContext;
    if (!context?.obs) {
      return new Response(JSON.stringify({ error: 'OBS API not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all inputs (audio sources)
    const inputsResponse = await context.obs.call('GetInputList');
    const inputs = inputsResponse.inputs || [];

    // Get audio details for each input
    const audioSources = [];
    for (const input of inputs) {
      try {
        // Check if it has audio
        const volumeResponse = await context.obs.call('GetInputVolume', { 
          inputName: input.inputName 
        });
        const muteResponse = await context.obs.call('GetInputMute', { 
          inputName: input.inputName 
        });

        audioSources.push({
          name: input.inputName,
          volume: Math.round((volumeResponse.inputVolumeMul || 0) * 100),
          volumeDb: volumeResponse.inputVolumeDb || -Infinity,
          muted: muteResponse.inputMuted || false,
          kind: input.inputKind
        });
      } catch (err) {
        // Skip non-audio inputs
      }
    }

    return new Response(JSON.stringify({
      audioSources
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      audioSources: []
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
    const { action, inputName, volume, muted } = body;

    if (action === 'setVolume') {
      // Convert percentage to dB
      const volumeMul = volume / 100;
      const volumeDb = volumeMul === 0 ? -100 : 20 * Math.log10(volumeMul);
      
      await context.obs.call('SetInputVolume', { 
        inputName, 
        inputVolumeDb: volumeDb 
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'setMute') {
      await context.obs.call('SetInputMute', { 
        inputName, 
        inputMuted: muted 
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggleMute') {
      await context.obs.call('ToggleInputMute', { inputName });
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
