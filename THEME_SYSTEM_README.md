# 🎨 Light/Dark Theme System Documentation

## Overview
The app now features a complete light/dark theme system with smooth transitions, persistent user preference, and automatic system preference detection.

## Features Implemented

### ✅ **1. Dual Theme Support**
- **Dark Mode (Default)**: Deep navy blue to black gradients, soft white text, teal/lavender accents
- **Light Mode**: Soft cream/pale blue background, dark gray text, gentle teal/purple accents
- Both themes maintain the app's calm, relaxing aesthetic

### ✅ **2. Theme Files Created**

#### `src/theme/dark-theme.scss`
- Complete dark theme color palette
- 300+ color variables organized by category
- Already integrated into the app

#### `src/theme/light-theme.scss`
- Mirror structure of dark theme with light-appropriate colors
- Same variable names for seamless switching
- Soft, calming light colors with proper contrast

#### `src/theme/theme-variables.scss`
- Defines CSS custom properties for dynamic theme switching
- Maps SCSS variables to CSS variables
- Switches based on `body.dark` or `body.light` classes

### ✅ **3. Theme Service** (`src/app/services/theme.service.ts`)

**Features:**
- Uses Angular signals for reactive state management
- Automatically detects system preference on first launch
- Saves user preference to localStorage
- Provides methods for theme manipulation

**API:**
```typescript
// Get current theme
themeService.currentTheme() // 'light' | 'dark'

// Toggle theme
themeService.toggleTheme()

// Set specific theme
themeService.setTheme('light') // or 'dark'

// Check theme state
themeService.isDark() // boolean
themeService.isLight() // boolean
```

### ✅ **4. Theme Toggle in Settings**
- Added "Appearance" section in Settings page
- Toggle switch with moon/sun icon that changes based on theme
- Smooth animations with instant UI updates
- No page refresh required

### ✅ **5. Dynamic Background Images**
- **Dark Mode**: `assets/images/background.png`
- **Light Mode**: `assets/images/Gemini_Generated_Image_uexyrruexyrruexy (2).png`
- Automatic switching based on theme
- Smooth transitions (0.3s ease)

### ✅ **6. Smooth Transitions**
All UI elements transition smoothly when theme changes:
- Background colors: 0.3s ease
- Text colors: 0.3s ease
- Border colors: 0.3s ease
- Box shadows: 0.3s ease
- Background images: 0.3s ease

### ✅ **7. Persistent Theme Preference**
- User's theme choice is saved to localStorage
- Automatically restored on app launch
- Falls back to system preference if no saved preference

### ✅ **8. System Integration**
- Respects `prefers-color-scheme` media query on first launch
- Ionic-compatible theming using CSS variables
- Works on both mobile and browser builds

## File Structure

```
src/
├── theme/
│   ├── dark-theme.scss          # Dark theme color palette
│   ├── light-theme.scss         # Light theme color palette
│   ├── theme-variables.scss     # CSS custom properties for dynamic switching
│   └── variables.scss           # Imports dark theme (for backwards compatibility)
├── app/
│   ├── services/
│   │   └── theme.service.ts     # Theme management service
│   ├── pages/
│   │   └── settings/
│   │       ├── settings.page.ts    # Settings with theme toggle
│   │       ├── settings.page.html  # Theme toggle UI
│   │       └── settings.page.scss  # Theme toggle styling
│   └── app.component.ts         # Initializes theme service
└── global.scss                  # Theme transitions and background switching
```

## Color Palettes

### Dark Theme Colors
- **Primary**: `#6fffe9` (Bright Teal/Cyan)
- **Background**: `#0a0e1a` to `#2d3748` (Deep navy to slate)
- **Text**: `#ffffff` variations (White with opacity)
- **Accents**: Pastels - Blue, Purple, Cyan, Violet, Pink

### Light Theme Colors
- **Primary**: `#5bc0be` (Calming Teal)
- **Background**: `#f8f9fb` to `#e8ebef` (Soft whites/creams)
- **Text**: `#1a1a1a` variations (Dark grays with opacity)
- **Accents**: Gentle versions of the dark theme accents

## Usage Examples

### Using SCSS Variables in Component Styles
```scss
@use "../../../theme/dark-theme.scss" as *;

.my-component {
  background: $bg-primary;
  color: $text-primary;
  border: 1px solid $border-white-10;
}
```

### Using CSS Custom Properties (Recommended for Dynamic Elements)
```scss
.my-dynamic-component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);
}
```

### Programmatic Theme Control
```typescript
import { ThemeService } from './services/theme.service';

export class MyComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  isDark = computed(() => this.themeService.isDark());
}
```

## Testing

### Browser Testing
1. Open app in browser
2. Go to Settings tab
3. Toggle "Dark Mode" switch
4. Verify:
   - Theme changes instantly
   - Background image switches
   - All colors update properly
   - Transitions are smooth
5. Refresh page - theme should persist

### Mobile Testing
1. Build and run on device: `ionic cap run android` or `ionic cap run ios`
2. Follow same steps as browser testing
3. Close and reopen app - theme should persist

### System Preference Testing
1. Clear localStorage: `localStorage.clear()`
2. Reload app
3. Theme should match system preference
4. Change system preference
5. Reload app - theme should update

## Customization

### Adding New Colors
1. Add to both `dark-theme.scss` and `light-theme.scss`
2. Use same variable name in both files
3. Add to `theme-variables.scss` if you need dynamic switching
4. Use the variable in your components

### Modifying Existing Colors
1. Update the color value in `dark-theme.scss` or `light-theme.scss`
2. Changes apply globally wherever that variable is used
3. No need to update components

### Creating a Third Theme (e.g., "Auto")
1. Create new SCSS file (e.g., `auto-theme.scss`)
2. Update `ThemeService` to support 'auto' theme
3. Add logic to detect and apply system preference changes
4. Update settings toggle to include third option

## Performance Considerations

### Optimizations Implemented
- ✅ Signals for reactive state (minimal re-renders)
- ✅ CSS transitions (GPU-accelerated)
- ✅ Single localStorage read/write per theme change
- ✅ Computed signals for derived state
- ✅ OnPush change detection in settings component

### Best Practices
- Use CSS variables for frequently changing properties
- Use SCSS variables for static compilation-time values
- Avoid inline styles - use class-based theming
- Batch theme-related changes together

## Troubleshooting

### Theme Not Persisting
**Problem**: Theme resets on app reload
**Solution**: Check localStorage permissions, ensure ThemeService is initialized in AppComponent

### Colors Not Changing
**Problem**: Some elements don't change color with theme
**Solution**: Ensure those elements use theme variables (SCSS or CSS custom properties)

### Transitions Too Slow/Fast
**Problem**: Theme transitions feel wrong
**Solution**: Adjust transition duration in `global.scss` (currently 0.3s)

### Background Image Not Switching
**Problem**: Background stays the same in both themes
**Solution**: 
1. Check image paths in `global.scss`
2. Verify images exist in `assets/images/`
3. Check body class is being applied (`body.dark` or `body.light`)

## Future Enhancements

### Possible Additions
- [ ] Auto theme (follows system preference in real-time)
- [ ] Custom theme colors (user-defined palettes)
- [ ] Scheduled themes (auto-switch at certain times)
- [ ] Multiple preset themes
- [ ] Theme preview in settings
- [ ] Accessibility adjustments per theme

## Accessibility

### WCAG Compliance
- ✅ Dark theme maintains 4.5:1 contrast ratio
- ✅ Light theme maintains 4.5:1 contrast ratio
- ✅ Respects prefers-color-scheme
- ✅ No color-only information (icons + labels)
- ✅ Smooth transitions (respects prefers-reduced-motion)

### Testing Contrast
```bash
# Use browser DevTools or online tools
# - Chrome DevTools: Elements > Contrast
# - WebAIM: https://webaim.org/resources/contrastchecker/
```

## Credits
- Theme system designed for Sleep Calm Sounds
- Built with Angular 19 + Ionic 8
- Uses Angular Signals for state management
- SCSS modular architecture for maintainability

---

**Last Updated**: 2025-01-24  
**Version**: 1.0.0  
**Status**: ✅ Complete and Production Ready


