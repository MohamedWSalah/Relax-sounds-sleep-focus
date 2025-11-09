# 🚀 Quick Release Guide - Google Play (Updated)

## Building Your App Bundle (Every Release)

Upgrade version in package.json
Upgrade version in buikd.gradle

### Step by Step (Recommended)

```bash
# 1) Build production web
ionic build

# 2) Copy web to native
npx cap copy android

# (if plugin changes)
npx cap sync android

# 3) Build AAB
cd android
./gradlew bundleRelease   # windows: gradlew.bat bundleRelease
```

### Then open Android Studio

```bash
npx cap open android
```

Build + Run from Android Studio.

---

## 📦 Find Your AAB File

`android/app/build/outputs/bundle/release/app-release.aab`

---

## 📝 Google Play Checklist

- Increment versionCode + versionName in `android/app/build.gradle`
- Build release bundle
- Upload to Play Console

---

## Quick Commands Reference

```bash
ionic build
npx cap copy android
npx cap open android
```

(bundle release is always from Android Studio or gradlew)

---

## Common Errors

**"Version code must be unique"** → increment versionCode

**"keystore not found"** → check key.properties path
