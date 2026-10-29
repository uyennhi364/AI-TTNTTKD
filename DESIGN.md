# DESIGN.md — AI Feng Shui Studio Design System

> Based on principles from **Impeccable**, **Awesome DESIGN.md**, **Taste Skill**, and **Emil Kowalski's Design Engineering**.

## 1. Product Identity & Vibe
- **Category**: 3D Interior Architecture + AI Feng Shui Studio.
- **Visual Direction**: Editorial Architectural Atelier. Not a SaaS dashboard, not an AI chatbot wrapper.
- **Hero Element**: The 3D Bedroom Model (~70% of screen presence).
- **Secondary Surfaces**: Warm ivory floating architectural cards (`#FAF8F5`) resting gently over the dark charcoal canvas (`#1E201E`).

---

## 2. Color Palette & Tokens

| Token | Hex / Value | Usage |
|---|---|---|
| `--color-canvas` | `#1E201E` | Primary backdrop behind the 3D room |
| `--color-panel-bg` | `#FAF8F5` | Floating cards background (warm alabaster cream) |
| `--color-panel-border` | `#E8DEC8` | Architectural sand border |
| `--color-primary` | `#00705a` | Sacred emerald accent (primary CTA, active pills) |
| `--color-primary-hover` | `#005c4a` | Primary button hover |
| `--color-text-main` | `#1C1917` | High contrast stone-900 typography |
| `--color-text-muted` | `#78716C` | Neutral stone-500 secondary text |
| `--color-auspicious` | `#00705a` | Auspicious (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) |
| `--color-inauspicious` | `#DC2626` | Inauspicious (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại) |
| `--color-warning` | `#D97706` | Medium severity room adjustments |

---

## 3. Typography
- **Primary Typeface**: `Plus Jakarta Sans`, sans-serif. Modern, geometric, clean architectural legibility.
- **Display / Headers**: `Outfit`, sans-serif for headings and numerical score callouts.
- **Numbers / Metrics**: Tabular numbers for coordinates, angles, and scores.

---

## 4. Interaction Physics & Motion (Emil Kowalski Rules)

### Easing Curves
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* For entrances, popovers, dropdowns */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* For continuous motion */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* For modal slides & bottom docks */
```

### Motion Rules
1. **Never animate from `scale(0)`**: Always enter from `scale(0.95)` with `opacity: 0` to `scale(1)` with `opacity: 1`.
2. **Buttons must feel responsive**: Apply `transform: scale(0.97)` on `:active` with `160ms` duration.
3. **Never use `ease-in` for UI animations**: It creates sluggish perceived latency.
4. **Fast feedback**: Keep all interaction durations between `120ms` and `220ms`.

---

## 5. Anti-Patterns (Explicitly Forbidden)
- ❌ **No AI Sparkles or Glyphs**: Avoid `✨`, `🪄`, `✦`, `🤖`, or generic "AI" badges next to action buttons.
- ❌ **No Nested Card Hell**: Do not place cards inside cards inside cards.
- ❌ **No Pure Black (`#000000`) or Pure Gray**: Always tint blacks and grays with warm or green tones.
- ❌ **No Generic SaaS Progress Bar Dashboards**: Information is conveyed through 3D spatial models and structured dossier cards.
