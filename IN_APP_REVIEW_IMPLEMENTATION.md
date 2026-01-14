# Google Play In-App Review Implementation Guide

This document explains the implementation of Google Play In-App Review API for the Android app.

## Overview

The implementation uses `@capacitor-community/in-app-review` plugin to show the native Google Play review dialog inside the app. It follows Google Play policies strictly:

- ✅ Shows review dialog inside the app (no redirect)
- ✅ Fails silently if Google decides not to show the dialog
- ✅ Cooldown mechanism: at most once every 14 days
- ✅ Eligibility based on usage (5+ launches OR 3+ sessions)
- ✅ Never blocks the user
- ✅ No incentives, no gating, no tracking

## Installation

### 1. Install the Plugin

```bash
npm install @capacitor-community/in-app-review --legacy-peer-deps
```

### 2. Sync Capacitor

After building your web assets:

```bash
ionic build
npx cap sync android
```

## Android Setup

No additional Android configuration is required. The plugin uses the Google Play Review library automatically.

### Optional: Customize Review Library Version

If you need to customize the Google Play Review library version, add this to `android/variables.gradle`:

```gradle
ext {
    // ... existing variables ...
    googleAndroidPlayReviewVersion = '2.0.2' // Default version used by plugin
}
```

## Implementation Details

### Service: `InAppReviewService`

Location: `src/app/services/in-app-review.service.ts`

**Key Features:**
- Tracks app launches (stored in Capacitor Preferences)
- Tracks completed relaxation sessions (30+ seconds duration)
- Implements 14-day cooldown period
- Checks eligibility before showing review dialog
- Android-only (ignores iOS/web platforms)

**Storage Keys:**
- `last_review_timestamp`: Timestamp of last review request
- `app_launch_count`: Total number of app launches
- `completed_session_count`: Total number of completed sessions (30+ seconds)

**Eligibility Criteria:**
- User must have launched the app **5+ times** OR
- User must have completed **3+ relaxation sessions** (30+ seconds each)
- At least **14 days** must have passed since the last review request

### Automatic Tracking

The service automatically tracks:

1. **App Launches**: Tracked in `app.component.ts` on app startup
2. **Completed Sessions**: Tracked in `sleep-tracker.service.ts` when a session ends (30+ seconds)

## Usage Examples

### Example 1: Request Review After Session Completion

After a user completes a relaxation session, you can request a review:

```typescript
import { Component, inject } from '@angular/core';
import { InAppReviewService } from '../services/in-app-review.service';
import { SleepTrackerService } from '../services/sleep-tracker.service';

@Component({
  // ... component config
})
export class MyComponent {
  private inAppReviewService = inject(InAppReviewService);
  private sleepTrackerService = inject(SleepTrackerService);

  async onSessionComplete() {
    // Your session completion logic here
    
    // Request review if eligible (non-blocking, may not show)
    await this.inAppReviewService.requestReviewIfEligible();
  }
}
```

### Example 2: Request Review on Home Page After Multiple Sessions

Show review after user has used the app multiple times:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { InAppReviewService } from '../services/in-app-review.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  // ... other config
})
export class HomePage implements OnInit {
  private inAppReviewService = inject(InAppReviewService);

  async ngOnInit() {
    // After user navigates to home page
    // Check if they're eligible and request review
    await this.inAppReviewService.requestReviewIfEligible();
  }
}
```

### Example 3: Request Review After Timer Completion

Show review after a successful timer session:

```typescript
import { Component, inject } from '@angular/core';
import { InAppReviewService } from '../services/in-app-review.service';

@Component({
  // ... component config
})
export class TimerPage {
  private inAppReviewService = inject(InAppReviewService);

  async onTimerComplete() {
    // Timer completion logic
    
    // Request review if eligible
    // This is safe to call - it won't show if not eligible or in cooldown
    await this.inAppReviewService.requestReviewIfEligible();
  }
}
```

### Example 4: Manual Review Request (Settings Page)

Allow users to manually request a review from settings:

```typescript
import { Component, inject } from '@angular/core';
import { InAppReviewService } from '../services/in-app-review.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  // ... other config
})
export class SettingsPage {
  private inAppReviewService = inject(InAppReviewService);

  async onRateAppClick() {
    // Directly request review (still respects cooldown and eligibility)
    await this.inAppReviewService.requestReviewIfEligible();
  }
}
```

## API Reference

### `requestReviewIfEligible(): Promise<void>`

Main method to request a review. This method:
- Checks if running on Android native platform
- Verifies cooldown period (14 days)
- Checks eligibility (5 launches OR 3 sessions)
- Attempts to show review dialog
- Updates cooldown timestamp if dialog was shown
- Fails silently if Google decides not to show the dialog

**Safe to call multiple times** - will only show if all conditions are met.

### `trackAppLaunch(): Promise<void>`

Tracks an app launch. Called automatically in `app.component.ts`.

### `trackCompletedSession(): Promise<void>`

Tracks a completed relaxation session (30+ seconds). Called automatically in `sleep-tracker.service.ts`.

## Policy Compliance

This implementation strictly follows Google Play policies:

### ✅ What We Do

- Show review dialog inside the app (no redirect)
- Respect Google's decision to show/hide the dialog
- Implement cooldown to avoid annoying users
- Use eligibility criteria based on genuine usage
- Fail silently if dialog cannot be shown

### ❌ What We Don't Do

- Never force users to rate
- Never gate features behind reviews
- Never show incentives for reviews
- Never track user behavior for review purposes
- Never redirect to Play Store
- Never show custom rating UI

## Testing

### Testing Eligibility

To test the review dialog during development:

1. **Reset storage** (for testing):
   ```typescript
   // In browser console or test code
   await Preferences.remove({ key: 'last_review_timestamp' });
   await Preferences.remove({ key: 'app_launch_count' });
   await Preferences.remove({ key: 'completed_session_count' });
   ```

2. **Set test values**:
   ```typescript
   await Preferences.set({ key: 'app_launch_count', value: '5' });
   // or
   await Preferences.set({ key: 'completed_session_count', value: '3' });
   ```

3. **Call review request**:
   ```typescript
   await inAppReviewService.requestReviewIfEligible();
   ```

### Important Testing Notes

- The review dialog may **not appear** during development/testing
- Google limits how often the dialog can be shown
- The dialog only appears for users who have installed the app from Play Store
- Test on a real device with the app installed from Play Store (internal testing track is fine)

### Testing Checklist

- [ ] App launch tracking works (check Preferences)
- [ ] Session completion tracking works (30+ second sessions)
- [ ] Cooldown mechanism works (14 days)
- [ ] Review dialog appears when eligible (may not appear in testing)
- [ ] Review dialog fails silently when not eligible
- [ ] No errors when called multiple times
- [ ] Works only on Android native (ignores web/iOS)

## Troubleshooting

### Review Dialog Not Showing

**Common reasons:**
1. **Cooldown period**: Wait 14 days or reset `last_review_timestamp`
2. **Eligibility**: Ensure 5+ launches OR 3+ sessions
3. **Testing environment**: Dialog may not show in development
4. **Google's decision**: Google may choose not to show the dialog (this is normal)

### Plugin Not Found

If you get "plugin not found" errors:

```bash
# Reinstall plugin
npm install @capacitor-community/in-app-review --legacy-peer-deps

# Sync Capacitor
ionic build
npx cap sync android

# Rebuild Android project
cd android
./gradlew clean
```

## Files Modified

1. **`src/app/services/in-app-review.service.ts`** - New service file
2. **`src/app/app.component.ts`** - Added app launch tracking
3. **`src/app/services/sleep-tracker.service.ts`** - Added session completion tracking
4. **`package.json`** - Added `@capacitor-community/in-app-review` dependency

## References

- [Plugin Documentation](https://github.com/capacitor-community/in-app-review)
- [Google Play In-App Review Guidelines](https://developer.android.com/guide/playcore/in-app-review)
- [Google Play Review Policy](https://support.google.com/googleplay/android-developer/answer/9859673)

