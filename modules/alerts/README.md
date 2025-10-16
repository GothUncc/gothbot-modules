# Alert System Module

Multi-platform stream alerts with custom animations, sounds, and TTS support.

## Features

- ✅ **Multi-Platform Support** - Works with Twitch, YouTube, Kick, and more
- ✅ **Alert Types** - Follow, Subscribe, Raid, Donation, Cheer/Bits
- ✅ **Custom Animations** - Slide, Fade, Bounce, Zoom, Confetti effects
- ✅ **Sound Effects** - Built-in sounds with volume control
- ✅ **Text-to-Speech** - Optional TTS for alert messages
- ✅ **Smart Queue** - Prevents alert overlap with queue management
- ✅ **Configurable** - Extensive customization via web UI
- ✅ **Test Mode** - Preview alerts without real events
- ✅ **OBS Integration** - Easy browser source setup

## Installation

1. Navigate to the Modules section in the GothBot admin panel
2. Find "Alert System" in the marketplace
3. Click "Install"
4. Click "Enable" to activate the module

## Configuration

### Alert Types

Enable or disable specific alert types:
- **Follow Alerts** - Show when someone follows
- **Subscribe Alerts** - Show for subscriptions
- **Raid Alerts** - Show for incoming raids
- **Donation Alerts** - Show for donations/tips
- **Cheer Alerts** - Show for bits/cheers

### Display Settings

- **Alert Duration** - How long each alert displays (2-30 seconds)
- **Animation Style** - Choose from slide, fade, bounce, zoom, or confetti
- **Alert Position** - Where alerts appear on screen
- **Sound Volume** - Alert sound volume (0-100)

### Minimum Amounts

Set minimum amounts to trigger alerts:
- **Minimum Donation** - Minimum donation amount
- **Minimum Cheers** - Minimum bits to trigger alert

### Text-to-Speech

- **Enable TTS** - Read alert messages aloud
- **TTS Voice** - Choose voice (US, UK, AU English)

### Custom Sounds

Add your own alert sounds by providing URLs:
- **Follow Sound URL** - Custom sound for follows
- **Subscribe Sound URL** - Custom sound for subscriptions
- **Raid Sound URL** - Custom sound for raids

## OBS Browser Source Setup

1. In OBS, add a new Browser Source
2. Set the URL to: `http://your-gothbot-url/overlay/alerts`
3. Set dimensions:
   - Width: 1920
   - Height: 1080
4. Check "Shutdown source when not visible"
5. Uncheck "Control audio via OBS"
6. Click OK

### Recommended OBS Settings

- **FPS:** 60
- **CSS:** (leave blank)
- **Shutdown source when not visible:** ✅
- **Refresh browser when scene becomes active:** ❌

## Testing Alerts

The module includes a test mode to preview alerts:

1. Go to Modules → Alert System → Configure
2. Scroll to the bottom
3. Click "Test Alert" buttons for each type
4. Verify alerts appear correctly in OBS

## Troubleshooting

### Alerts not showing

1. Check that the module is enabled
2. Verify platform connections are active
3. Check minimum amount settings
4. Test using the "Test Alert" feature

### No sound

1. Check sound volume setting (must be > 0)
2. In OBS, uncheck "Control audio via OBS" on the browser source
3. Ensure your browser allows audio autoplay

### Alerts overlapping

The module includes queue management to prevent overlaps. If you still experience issues:
1. Increase Alert Duration
2. Check that you only have one Alert System module enabled

## API Endpoints

The module exposes these endpoints for overlay integration:

- `GET /api/modules/alerts/data/currentAlert` - Get current alert to display
- `GET /api/modules/alerts/config` - Get module configuration
- `POST /api/modules/alerts/test/:type` - Trigger test alert

## Customization

### Custom Sounds

Place audio files in `modules/alerts/sounds/`:
- `follow.mp3` - Follow alert sound
- `subscribe.mp3` - Subscribe alert sound
- `raid.mp3` - Raid alert sound
- `donation.mp3` - Donation alert sound
- `cheer.mp3` - Cheer alert sound

### Custom Templates

Edit `modules/alerts/templates/overlay.html` to customize:
- Alert appearance
- Animations
- Positioning
- Colors and fonts

## Module Data Storage

The module stores:
- **Current Alert** - Currently displaying alert
- **Alert History** - Last 100 alerts (for stats/replay)

## Performance

- Lightweight - Minimal CPU usage
- Smart queue - Prevents memory leaks
- Efficient rendering - 60 FPS animations
- Small footprint - ~500KB total

## Support

For issues or questions:
1. Check module logs in admin panel
2. Verify configuration settings
3. Test with different platforms
4. Report bugs on GitHub

## License

MIT License - Part of GothomationBot
