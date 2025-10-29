# 🚀 Quick Release Guide - Google Play

## Prerequisites (One-Time Setup)

### 1. Create Your Keystore (First time only!)
```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ CRITICAL: Back up your keystore and remember passwords!**

### 2. Create key.properties File
```bash
cd android
cp key.properties.template key.properties
```

Then edit `android/key.properties` with your actual values:
```properties
RELEASE_STORE_FILE=my-release-key.keystore
RELEASE_STORE_PASSWORD=your_actual_password
RELEASE_KEY_ALIAS=my-key-alias
RELEASE_KEY_PASSWORD=your_actual_password
```

## Building Your App Bundle (Every Release)

### Option 1: Windows (One Command)
```bash
npm run release:build:windows
```

### Option 2: Mac/Linux (One Command)
```bash
npm run release:build
```

### Option 3: Step by Step
```bash
# Step 1: Build production web app
npm run build:prod

# Step 2: Sync with Android
npm run cap:sync

# Step 3: Build AAB (Windows)
npm run android:build:windows

# Step 3: Build AAB (Mac/Linux)
npm run android:build
```

## 📦 Find Your AAB File

Location: `android/app/build/outputs/bundle/release/app-release.aab`

## 📝 Google Play Console Checklist

### Before First Upload:
- [ ] App ID matches: `com.moon.sleepcalmsounds`
- [ ] Keystore created and backed up
- [ ] `key.properties` configured

### For Every Release:
- [ ] Update version in `android/app/build.gradle`:
  ```gradle
  versionCode 1  // Increment: 1, 2, 3, 4...
  versionName "1.0"  // Update: 1.0, 1.1, 2.0...
  ```
- [ ] Build AAB file
- [ ] Upload to Google Play Console

### First Submission Only:

#### 1. **Upload AAB**
   - Production → Create Release → Upload app-release.aab

#### 2. **App Description**
   - Store presence → Main store listing
   - Copy from: `GOOGLE_PLAY_SUBMISSION_GUIDE.md`

#### 3. **Graphics Assets**
   - App Icon: 512x512 (use `resources/icon.png`)
   - Feature Graphic: 1024x500 (create or use design tool)
   - Screenshots: At least 2 (capture from phone)

#### 4. **Select Countries**
   - Production → Countries/regions
   - Select: Worldwide or specific countries

#### 5. **Data Safety**
   - App content → Data safety
   - Answer: Minimal data collection (see privacy policy)

#### 6. **Privacy Policy**
   - Copy from `PRIVACY_POLICY.md`
   - Host on: GitHub Pages, website, or use Google Sites
   - Add URL to Play Console

#### 7. **Content Rating**
   - App content → Content rating
   - Complete questionnaire (likely E for Everyone)

#### 8. **App Category**
   - Select: Health & Fitness

#### 9. **Target Audience**
   - Select age groups (18+)

## 🔄 Update Process (After First Release)

1. **Increment Version**
   ```gradle
   // In android/app/build.gradle
   versionCode 2  // Was 1
   versionName "1.1"  // Was 1.0
   ```

2. **Build New AAB**
   ```bash
   npm run release:build:windows
   ```

3. **Upload to Play Console**
   - Production → Create Release
   - Upload new AAB
   - Add release notes
   - Submit for review

## ⚡ Quick Commands Reference

```bash
# Build everything for release (Windows)
npm run release:build:windows

# Build everything for release (Mac/Linux)
npm run release:build

# Just build web app
npm run build:prod

# Just sync to Android
npm run cap:sync

# Just build Android AAB (after sync)
npm run android:build:windows  # Windows
npm run android:build          # Mac/Linux
```

## 📍 File Locations

```
android/app/build.gradle              → Version numbers
android/key.properties                → Signing keys (DO NOT COMMIT!)
android/app/my-release-key.keystore   → Your keystore (BACK THIS UP!)
android/app/build/outputs/bundle/release/app-release.aab  → Your AAB file
```

## ❗ Common Issues

### Build fails: "Task :app:bundleReleaseResources FAILED"
- Clean build: `cd android && ./gradlew clean`
- Try again

### "Keystore not found"
- Check `key.properties` paths are correct
- Ensure keystore is in `android/app/` directory

### "Version code must be unique"
- Increment versionCode in `build.gradle`

### "APK/AAB already exists"
- You're uploading the same version again
- Increment versionCode and rebuild

## 🎯 First Release Summary

```bash
# 1. One-time setup
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
cd ..
cp key.properties.template key.properties
# Edit key.properties with your passwords

# 2. Build for release
cd ../..  # Back to project root
npm run release:build:windows

# 3. Upload AAB from: android/app/build/outputs/bundle/release/app-release.aab

# 4. Complete Play Console forms (see GOOGLE_PLAY_SUBMISSION_GUIDE.md)

# 5. Submit for review!
```

## 📞 Help

See full guide: `GOOGLE_PLAY_SUBMISSION_GUIDE.md`
Privacy policy: `PRIVACY_POLICY.md`

---

**Good luck! 🎉**

