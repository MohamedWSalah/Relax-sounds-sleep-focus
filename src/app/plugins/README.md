# ScreenStateListener Plugin

Custom Capacitor plugin for detecting device screen state changes on Android.

## Overview

This plugin registers a native Android `BroadcastReceiver` that listens to system-level screen events, allowing the app to detect when the device screen is turned on/off or when the user unlocks the device.

## Features

- ✅ **Native Android Implementation** (Kotlin)
- ✅ **System-level event detection** (works even in background)
- ✅ **Zero dependencies** - uses only Android SDK APIs
- ✅ **Automatic cleanup** - unregisters receiver on destroy
- ✅ **Web fallback** - uses Page Visibility API for browser testing

## Events

### `screenOn`

Fired when the device screen turns on.

```typescript
ScreenStateListener.addListener("screenOn", (data) => {
  console.log("Screen turned on", data.state); // 'on'
});
```

### `screenOff`

Fired when the device screen turns off (locked or sleep).

```typescript
ScreenStateListener.addListener("screenOff", (data) => {
  console.log("Screen turned off", data.state); // 'off'
});
```

### `userPresent`

Fired when the user unlocks the device.

```typescript
ScreenStateListener.addListener("userPresent", (data) => {
  console.log("User unlocked device", data.state); // 'unlocked'
});
```

## Usage

### Start Listening

```typescript
import ScreenStateListener from "@/app/plugins/screen-state-listener";

// Start the listener
await ScreenStateListener.startListening();

// Register event handlers
const screenOnListener = await ScreenStateListener.addListener("screenOn", (data) => {
  console.log("Screen on:", data);
});

const screenOffListener = await ScreenStateListener.addListener("screenOff", (data) => {
  console.log("Screen off:", data);
});

const unlockListener = await ScreenStateListener.addListener("userPresent", (data) => {
  console.log("Device unlocked:", data);
});
```

### Stop Listening

```typescript
// Remove specific listeners
await screenOnListener.remove();
await screenOffListener.remove();
await unlockListener.remove();

// Or remove all listeners
await ScreenStateListener.removeAllListeners();

// Stop the native listener
await ScreenStateListener.stopListening();
```

## Implementation Details

### Android (Kotlin)

**Location:** `android/app/src/main/java/com/moon/sleepcalmsounds/ScreenStateListenerPlugin.kt`

The plugin registers a `BroadcastReceiver` that listens to:

- `Intent.ACTION_SCREEN_ON` - Screen turned on
- `Intent.ACTION_SCREEN_OFF` - Screen turned off
- `Intent.ACTION_USER_PRESENT` - Device unlocked

The receiver is automatically registered when the plugin loads and unregistered when destroyed.

### Web (TypeScript)

**Location:** `src/app/plugins/screen-state-listener.web.ts`

Uses the Page Visibility API:

- `document.hidden` → fires `screenOff`
- `!document.hidden` → fires `screenOn` and `userPresent`

## Use Case: Device Inactivity Detection

This plugin is used in the `SmartTimerMonitorService` to detect true device inactivity:

```typescript
// Start monitoring
await ScreenStateListener.startListening();

let lastActiveTime = Date.now();
let inactivityStartTime: number | null = null;

// Screen turns off → start inactivity countdown
await ScreenStateListener.addListener("screenOff", () => {
  inactivityStartTime = Date.now();
});

// Screen turns on or user unlocks → reset timer
await ScreenStateListener.addListener("screenOn", () => {
  lastActiveTime = Date.now();
  inactivityStartTime = null;
});

await ScreenStateListener.addListener("userPresent", () => {
  lastActiveTime = Date.now();
  inactivityStartTime = null;
});

// Check periodically
setInterval(() => {
  if (inactivityStartTime) {
    const inactive = Date.now() - inactivityStartTime;
    if (inactive > INACTIVITY_LIMIT) {
      // Stop playback
    }
  }
}, 5000);
```

## Notes

- ✅ Works in background (no foreground service needed)
- ✅ No special Android permissions required
- ✅ Automatically cleans up on app destroy
- ⚠️ Android-only (iOS would need different implementation)
- ⚠️ Web version uses Page Visibility API (less accurate)

## Testing

1. Start the app with inactivity monitoring enabled
2. Lock the device (screen off)
3. Wait for the configured inactivity duration
4. Unlock the device
5. Check logs to see screen state events

## Syncing

After making changes to the plugin, sync with Capacitor:

```bash
npx cap sync android
```
