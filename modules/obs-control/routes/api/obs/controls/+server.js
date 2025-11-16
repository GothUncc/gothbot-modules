export async function GET({ locals }) {
  try {
    const context = locals.moduleContext;
    if (!context?.obs) {
      return new Response(JSON.stringify({ error: 'OBS API not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get streaming status
    const streamStatus = await context.obs.call('GetStreamStatus');
    
    // Get recording status
    const recordStatus = await context.obs.call('GetRecordStatus');
    
    // Get virtual camera status
    const virtualCamStatus = await context.obs.call('GetVirtualCamStatus');
    
    // Get replay buffer status
    const replayStatus = await context.obs.call('GetReplayBufferStatus');
    
    // Get stats
    const stats = await context.obs.call('GetStats');

    return new Response(JSON.stringify({
      streaming: streamStatus.outputActive || false,
      recording: recordStatus.outputActive || false,
      virtualCam: virtualCamStatus.outputActive || false,
      replayBuffer: replayStatus.outputActive || false,
      stats: {
        cpu: stats.cpuUsage || 0,
        fps: stats.activeFps || 0,
        dropped: stats.outputSkippedFrames || 0,
        kbps: streamStatus.outputBytes ? Math.round((streamStatus.outputBytes * 8) / streamStatus.outputDuration / 1000) : 0,
        renderTime: `${(stats.averageFrameRenderTime || 0).toFixed(1)} ms`,
        encodingTime: `${(stats.renderTimePerFrame || 0).toFixed(1)} ms`
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      streaming: false,
      recording: false,
      virtualCam: false,
      replayBuffer: false,
      stats: { cpu: 0, fps: 0, dropped: 0, kbps: 0, renderTime: '0.0 ms', encodingTime: '0.0 ms' }
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
    const { action } = body;

    if (action === 'toggleStreaming') {
      await context.obs.call('ToggleStream');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggleRecording') {
      await context.obs.call('ToggleRecord');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggleVirtualCam') {
      await context.obs.call('ToggleVirtualCam');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggleReplayBuffer') {
      await context.obs.call('ToggleReplayBuffer');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'saveReplay') {
      await context.obs.call('SaveReplayBuffer');
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
