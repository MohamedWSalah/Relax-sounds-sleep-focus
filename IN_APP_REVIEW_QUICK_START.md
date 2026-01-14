# In-App Review - Quick Start

## ✅ Implementation Complete

The Google Play In-App Review API has been fully implemented with policy-compliant behavior.

## What Was Implemented

1. **Service**: `src/app/services/in-app-review.service.ts`

   - Eligibility tracking (5 launches OR 3 sessions)
   - 14-day cooldown mechanism
   - Android-only implementation

2. **Automatic Tracking**:

   - App launches tracked in `app.component.ts`
   - Session completions tracked in `sleep-tracker.service.ts` (30+ seconds)

3. **Review Request**:
   - Automatically requested after timer completion in `timer.service.ts`
   - Can be called manually from any component

## Quick Usage

### Call Review Request

```typescript
import { InAppReviewService } from './services/in-app-review.service';

// In your component
private inAppReviewService = inject(InAppReviewService);

// Request review (respects cooldown and eligibility)
await this.inAppReviewService.requestReviewIfEligible();
```

## Next Steps

1. **Build and Sync**:

   ```bash
   ionic build
   npx cap sync android
   ```

2. **Test on Device**:

   - Install app from Play Store (internal testing track is fine)
   - Complete 3 sessions OR launch app 5 times
   - Review dialog should appear (may not show in testing)

3. **Monitor**:
   - Review dialog respects Google's decision to show/hide
   - Cooldown prevents showing too frequently
   - All tracking is local (no external tracking)

## Files Modified

- ✅ `src/app/services/in-app-review.service.ts` (NEW)
- ✅ `src/app/app.component.ts` (app launch tracking)
- ✅ `src/app/services/sleep-tracker.service.ts` (session tracking)
- ✅ `src/app/services/timer.service.ts` (review request after completion)
- ✅ `package.json` (plugin dependency)

## Documentation

See `IN_APP_REVIEW_IMPLEMENTATION.md` for complete documentation.
