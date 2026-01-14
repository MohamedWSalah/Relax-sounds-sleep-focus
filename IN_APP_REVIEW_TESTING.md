# In-App Review Testing Guide

## Important: Google Play's Internal Cooldown

**The review dialog may not appear even if our app requests it.** This is because Google Play has its own internal cooldown mechanism that is **separate from our app's cooldown**.

### What Happens When User Presses "Not Now"

When a user presses "Not now" on the review dialog:
1. Google Play remembers this choice
2. Google Play enforces its own cooldown (typically days or weeks)
3. Our app can request the review, but Google Play will silently ignore it
4. This cannot be bypassed - it's by design to respect user choice

### Our App's Cooldown vs Google Play's Cooldown

- **Our App's Cooldown**: We track in `Preferences` and can reset it
- **Google Play's Cooldown**: Stored by Google Play, persists across app reinstalls, cannot be reset by our app

## Testing the Review Dialog

### Method 1: Clear App Data (Recommended for Testing)

1. Go to **Settings > Apps > Your App > Storage**
2. Tap **Clear Data** (or **Clear Storage**)
3. Uninstall and reinstall the app
4. Launch the app 5+ times OR complete 3+ sessions
5. The review dialog should appear

**Note**: Even after clearing app data, if you pressed "Not now" before, Google Play may still remember and not show the dialog.

### Method 2: Use a Different Google Account

1. Sign out of the current Google account on the device
2. Sign in with a different Google account (or create a new one)
3. Install the app from Play Store with the new account
4. Launch the app 5+ times OR complete 3+ sessions
5. The review dialog should appear

### Method 3: Wait for Google Play's Cooldown

1. Wait several days/weeks (Google Play's internal cooldown)
2. Launch the app and complete sessions
3. The review dialog may appear again

### Method 4: Reset App Tracking (For Debugging)

You can reset our app's tracking data using the service method:

```typescript
// In browser console or component
const reviewService = inject(InAppReviewService);
await reviewService.resetTrackingData();

// Check status
const status = await reviewService.getTrackingStatus();
console.log(status);
```

**Note**: This only resets our app's tracking. Google Play's cooldown persists.

## Debugging

### Check Current Status

```typescript
const reviewService = inject(InAppReviewService);
const status = await reviewService.getTrackingStatus();
console.log('Review Status:', status);
```

This will show:
- `launchCount`: Number of app launches tracked
- `sessionCount`: Number of completed sessions tracked
- `lastReviewTimestamp`: When we last requested review (our app's timestamp)
- `isEligible`: Whether user meets our eligibility criteria
- `cooldownExpired`: Whether our app's cooldown has expired

### Check Logs

Look for these log messages:
- `[InAppReview] Requesting review. Launches: X, Sessions: Y` - Our app is requesting
- `[InAppReview] Review dialog requested successfully` - Request sent to Google Play
- `[InAppReview] NOTE: If dialog does not appear...` - Google Play may be blocking it

### What the Logs Tell Us

From your logs:
```
[InAppReview] Requesting review. Launches: 25, Sessions: 1
ReviewService : requestInAppReview
Request review flow finished
[InAppReview] Review dialog requested successfully
```

This shows:
- ✅ Our app is requesting the review correctly
- ✅ Google Play received the request
- ❌ But Google Play decided not to show the dialog (likely due to "Not now" cooldown)

## Production Behavior

In production:
- Users who haven't seen the dialog will see it when eligible
- Users who pressed "Not now" won't see it again for Google Play's cooldown period
- This is expected and compliant with Google Play policies
- Our app respects user choice by not forcing the dialog

## Summary

**The review dialog not appearing after pressing "Not now" is expected behavior.** Google Play enforces its own cooldown to respect user choice. Our app's cooldown is separate and only controls when we *request* the review, not when Google Play *shows* it.

