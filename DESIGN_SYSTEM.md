# Sleep Calm Sounds - Design System

## 🎨 Color Palette

### Primary Colors

- **Deep Navy**: `#0B132B` - Main background, deep ocean
- **Midnight Blue**: `#1C2541` - Secondary background, night sky
- **Turquoise**: `#5BC0BE` - Primary accent, ocean depths
- **Light Cyan**: `#6FFFE9` - Bright accent, moon glow

### Secondary Colors

- **Purple Haze**: `#3A4A6B` - Card backgrounds
- **Soft White**: `#EAEAEA` - Primary text
- **Muted Gray**: `#B8B8B8` - Secondary text
- **Transparent Overlay**: `rgba(11, 19, 43, 0.8)` - Modal backgrounds

### Gradient Backgrounds

- **Main Background**: `linear-gradient(135deg, #1c2541 0%, #0b132b 100%)`
- **Card Gradient**: `linear-gradient(145deg, #1b2a49 0%, #2a3f5f 100%)`
- **Glow Effect**: `linear-gradient(45deg, transparent, rgba(111, 255, 233, 0.1), transparent)`

## 🔤 Typography

### Font Family

- **Primary**: "Poppins" - Modern, rounded, soft
- **Fallback**: "Nunito Sans" - Alternative rounded font

### Font Weights

- **Light**: 300 - Subtle text, descriptions
- **Regular**: 400 - Body text
- **Medium**: 500 - Labels, buttons
- **SemiBold**: 600 - Headings
- **Bold**: 700 - Emphasis

### Font Sizes

- **Hero Title**: 1.75rem (28px) - App title
- **Card Title**: 1rem (16px) - Sound names
- **Body Text**: 0.9rem (14px) - Descriptions
- **Small Text**: 0.8rem (12px) - Captions

## 🎭 Visual Effects

### Shadows & Glows

- **Card Shadow**: `0 4px 12px rgba(0, 0, 0, 0.3)`
- **Selected Glow**: `0 0 20px rgba(111, 255, 233, 0.4)`
- **Text Glow**: `0 0 8px rgba(111, 255, 233, 0.3)`
- **Icon Glow**: `0 0 10px rgba(111, 255, 233, 0.5)`

### Border Radius

- **Cards**: 1rem (16px) - Soft, rounded
- **Buttons**: 0.75rem (12px) - Medium rounded
- **Small Elements**: 0.5rem (8px) - Subtle rounding

### Animations

- **Fade In/Out**: 0.5s ease-in-out
- **Float**: 2s ease-in-out infinite
- **Glow Pulse**: 2s ease-in-out infinite alternate
- **Hover Scale**: 0.3s ease transform scale(1.05)

## 📱 Component Specifications

### Sound Cards

- **Size**: 2-column grid (mobile), 3-column (tablet+)
- **Padding**: 1.5rem vertical, 1rem horizontal
- **Background**: Semi-transparent with backdrop blur
- **Border**: 2px solid transparent (glows when selected)
- **Icons**: 2.5rem emoji or custom SVG
- **Volume Controls**: Slide-in animation when selected

### Buttons

- **Primary**: Turquoise background with glow
- **Secondary**: Transparent with turquoise border
- **Clear**: Transparent with hover effects
- **Size**: 40px minimum touch target

### Modals

- **Background**: Blurred overlay with 80% opacity
- **Content**: Rounded corners, soft shadows
- **Animation**: Slide up from bottom
- **Close**: X button in top-right corner

## 🌊 Ocean Wave Pattern

- **Abstract wave shapes** in background
- **Subtle opacity** (0.05-0.1)
- **Slow animation** (10-15s duration)
- **Gradient**: Deep blue to turquoise

## ✨ Particle Effects

- **Floating particles** like gentle mist
- **Slow drift animation** (20-30s duration)
- **Low opacity** (0.1-0.2)
- **Random positioning** with CSS transforms

## 🎵 Sound Visualizations

- **Waveform bars** for active sounds
- **Pulsing glow** synchronized with audio
- **Color coding** by sound type
- **Smooth transitions** between states

## 📐 Layout Grid

- **Mobile**: 2-column grid, 1rem gaps
- **Tablet**: 3-column grid, 1.5rem gaps
- **Desktop**: 4-column grid, 2rem gaps
- **Max Width**: 800px container
- **Responsive Breakpoints**: 480px, 768px, 1024px

## 🎨 Icon System

- **Style**: Emoji-based for accessibility
- **Size**: 2.5rem for sound cards
- **Animation**: Subtle float on hover
- **Fallback**: Custom SVG icons
- **Categories**: Nature, City, Meditation, Instruments, ASMR

## 🌙 Moon & Wave Branding

- **Logo**: Glowing moon with soft waves
- **Animation**: Gentle floating motion
- **Colors**: White to turquoise gradient
- **Size**: 120px for splash, 60px for header
- **Shadow**: Soft glow effect

## 📱 Mobile-First Approach

- **Touch Targets**: Minimum 44px
- **Safe Areas**: Respect device notches
- **Gestures**: Swipe, tap, long-press
- **Accessibility**: High contrast, large text options
- **Performance**: Optimized animations, lazy loading
