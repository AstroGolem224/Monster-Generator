# 🔮 PRISM Hub — Brand Bible
**Clay Machine Games // Design System v2.1**
*Neon Cyberpunk Edition — mit vollständiger Effekt-Dokumentation*

---

## 1. Brand Philosophy

PRISM Hub ist das Nervenzentrum von Clay Machine Games — ein internes Ops-Tool das sich anfühlt wie ein Cyberpunk-Terminal aus der Zukunft. Kein generisches Dashboard. Kein Clean-Corporate. **Dunkel, neon, lebendig.**

**Kernprinzipien:**
- **Dark First** — Augen schonen beim Nacht-Sprint
- **Neon Accent** — Farbe als Signal, nicht als Dekoration
- **Glass Morphism** — Tiefe durch Transparenz und Glow
- **Mono x Display** — Code-Ästhetik trifft Industrial Typography
- **Motion speaks** — Animationen kommunizieren Zustand
- **Layered Atmosphere** — 5 übereinanderliegende Schichten erzeugen Tiefe
- **Visual Hierarchy & Anti-Clutter** — Strikte Texthierarchie + 8-Punkt-Grid-System für konsistente Abstände; Ikonografie basiert auf realen Objekten
- **Thematic Eras** — UI-Komponenten in architektonische Cyberpunk-Ären unterteilen: *Entropism*, *Kitsch*, *Neo Militarism*, *Neo Kitsch* — ergänzt durch Retro-Futurismus (späte 90er Web-Layouts) für Sub-Seiten

---

## 2. Color System

### 2.1 Background Palette (Dark Foundation)

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--bg-void` | `#080d13` | Tiefstes Schwarz — Body Background |
| `--bg-base` | `#0c1214` | Seiten-Hintergrund |
| `--bg-surface` | `#141b20` | Cards, Sidebar |
| `--bg-elevated` | `#1c2830` | Hover States, raised Elements |

> **Regel:** Immer von Void nach Elevated — niemals heller als `#1c2830` für Flächen.

### 2.2 Theme System — 3 Themen

PRISM Hub hat ein vollständiges Theme-System via `data-theme` auf `<html>`. Jedes Theme definiert den kompletten Token-Satz.

#### 🔥 Ember (Standard)
*Industrial. Glut. Forge-Ästhetik. Dunkel-warme Töne.*

| Token | Wert |
|-------|------|
| `--accent-primary` | `#d4520a` (Ember Orange) |
| `--accent-secondary` | `#c9972a` (Ember Gold) |
| `--accent-ember` | `#d4520a` |
| `--accent-gold` | `#c9972a` |
| `--rune-glow` | `#ff7b2e` (Glow-Farbe für Animationen) |
| `--bg-void` | `#080d13` |
| Particle-Colors | `rgb(212,82,10)`, `rgb(201,151,42)`, `rgb(255,123,46)`, `rgb(255,180,80)` |

#### ⚡ Neon
*Cyberpunk. Electric. Klassisches Tron-Feeling.*

| Token | Wert |
|-------|------|
| `--accent-primary` | `#0de8f5` (Cyan) |
| `--accent-secondary` | `#a855f7` (Violet) |
| `--rune-glow` | `#0de8f5` |
| `--neon-green` | `#22d3a0` |
| Particle-Colors | `rgb(13,232,245)`, `rgb(168,85,247)`, `rgb(34,211,160)` |

#### ☀️ Light
*Clean. Professional. Für Meetings und Screenshots.*

| Token | Wert |
|-------|------|
| `--accent-primary` | `#0891b2` |
| `--accent-secondary` | `#7c3aed` |
| `--bg-void` | `#f1f5f9` |
| `--bg-surface` | `#ffffff` |
| Besonderheit | Glows reduziert, mix-blend-mode: multiply |

### 2.3 Neon Accent Palette (Basis-Tokens)

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--neon-cyan` | `#0de8f5` | Primär-Akzent (Neon-Theme), Links, Interactive |
| `--neon-violet` | `#a855f7` | Secondary Accent, Tags, Badges |
| `--neon-green` | `#4caf50` | Success, Online-Status, Bestätigung |
| `--neon-amber` | `#f59e0b` | Warnung, Pending |
| `--neon-red` | `#ef4444` | Error, Offline, Danger |

> **Regel:** Im Ember-Theme → `--accent-ember` für primäre Akzente. Im Neon-Theme → `--neon-cyan`. Niemals hart-coded Farben, immer CSS Tokens.

> **Strikte Kontrastregeln:** Schlechte Kontrastkombinationen (z. B. roter Text auf rotem Panel) sind strengstens verboten. WCAG AA Minimum für alle Textelemente.

> **Dynamic State Feedback:** Nutze semantische Farbzuordnung — Rot = Gefahr/Warnung, Blau = Ruhe/Info, Pink/Magenta = Spielerisch. Setze dynamisches visuelles Feedback ein, z.B. einen roten `box-shadow`-Blur an Bildschirmrändern (`body { box-shadow: inset 0 0 80px rgba(239,68,68,0.15); }`) für kritische Systemwarnungen.

### 2.4 Glow System

```css
--glow-primary: 0 0 20px rgba(212, 82, 10, 0.3);   /* theme-aware */
--glow-ember:   0 0 20px rgba(212, 82, 10, 0.3);   /* ember accent */
--glow-soft:    0 0 40px rgba(212, 82, 10, 0.08);  /* ambient */
--glow-cyan:    0 0 20px rgba(13, 232, 245, 0.4);  /* static cyan */
--glow-violet:  0 0 20px rgba(168, 85, 247, 0.4);  /* static violet */
```

**Intensitäten:**
- `0.06–0.10` → Ambient Glow (immer vorhanden)
- `0.25–0.40` → Active / Hover Glow
- `0.60–0.80` → Focus / Selected State

### 2.5 Text Palette

| Token | Hex (Ember) | Verwendung |
|-------|-------------|------------|
| `--text-primary` | `#e0ddd5` | Haupttext, Headlines |
| `--text-secondary` | `#8a8578` | Subtitles, Labels |
| `--text-muted` | `#5a5548` | Hints, Timestamps, Disabled |

### 2.6 Glass Morphism

```css
--glass-bg:          rgba(12, 18, 20, 0.96);         /* fast opaque */
--glass-border:      rgba(212, 82, 10, 0.12);        /* accent-tinted */
--glass-border-hot:  rgba(212, 82, 10, 0.40);        /* hover/active */
```

**Card-Basis:**
```css
background: var(--glass-bg);
border: 1px solid var(--glass-border);
backdrop-filter: blur(12px);
border-radius: 8px;
```

> **Formgebung:** Anstelle von simplen `border-radius`-Hacks MUSS die moderne CSS-Eigenschaft `corner-shape` für abgeschrägte (beveled) oder squircle Ecken verwendet werden, um die harte Sci-Fi-Terminal-Ästhetik nativ und performant zu realisieren.
> ```css
> /* Sci-Fi Beveled Card */
> border-radius: 8px;
> corner-shape: bevel;   /* sobald browser-support vorhanden */
> /* Fallback: clip-path für ältere Browser */
> clip-path: polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px);
> ```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Weight | Verwendung |
|------|------|--------|------------|
| **Display** | Barlow Condensed | 700–900 | Page Titles, Hero Text, Nav Labels |
| **Body** | Inter | 400–600 | Fließtext, Descriptions, UI-Labels |
| **Mono** | JetBrains Mono | 400–700 | Code, IDs, Timestamps, Werte, Tags |
| **Display (Public)** | Orbitron | 400–900 | Public-Seite Hero Text |

```css
--font-display: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
--font-sans:    'Inter', 'Segoe UI', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

> **Strikte Fallback-Stacks:** Immer vollständige Fallback-Chains definieren (wie oben), um typografische Hierarchie bei Font-Ladeverzögerungen zu erhalten. Display-Fonts ohne Fallback sind verboten.

### 3.2 Type Scale

| Element | Font | Size | Weight | Styling |
|---------|------|------|--------|---------|
| Page Title | Barlow Condensed | 2.8rem | 800 | UPPERCASE, gold glow + accent-bar |
| Section Header | Barlow Condensed | 1.6rem | 700 | UPPERCASE |
| Card Title | Inter | 1rem | 600 | — |
| Body | Inter | 0.95rem | 400 | line-height: 1.7 |
| Label/Badge | JetBrains Mono | 0.75rem | 500 | UPPERCASE, letter-spacing: 0.08em |
| Code/Value | JetBrains Mono | 0.85rem | 400 | `--neon-cyan` color |

### 3.3 Text Effects

```css
/* Page Title mit Accent-Bar */
.page-title {
  font-family: var(--font-display);
  font-size: 2.8rem; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--accent-gold);
  text-shadow: 0 0 30px rgba(201,151,42,0.25), 0 0 60px rgba(201,151,42,0.1);
  display: flex; align-items: center; gap: 0.6rem;
}
.page-title::before {
  content: ''; display: inline-block;
  width: 4px; height: 1.6em;
  background: var(--accent-ember);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(212,82,10,0.4);
}

/* Shimmer für Hero Text */
.shimmer {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary));
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ember-shimmer 3s linear infinite;
}

/* Rune Pulse (Rune/Icon-Elemente) */
@keyframes rune-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px var(--rune-glow)); opacity: 0.8; }
  50% { filter: drop-shadow(0 0 14px var(--rune-glow)) brightness(1.2); opacity: 1; }
}
```

---

## 4. Background Effects — Das Atmosphären-System

PRISM Hub nutzt **5 übereinanderliegende Schichten** für die Hintergrundatmosphäre:

> **Accessibility Directive:** `@media (prefers-reduced-motion: reduce)` ist **Pflicht**. Alle driftenden Animationen (25s drift, hex-drift) werden pausiert und auf statisches Noise zurückgefallen.
> ```css
> @media (prefers-reduced-motion: reduce) {
>   body::before, body::after { animation: none; }
>   #ember-canvas             { display: none; }
>   *, *::before, *::after    { animation-duration: 0.01ms !important;
>                               transition-duration: 0.01ms !important; }
> }
> ```

```
Layer 5 (z: 9998): Scanlines
Layer 4 (z: 9997): SVG Noise Grain
Layer 3 (z:    0): Ember Canvas (Partikel-System)
Layer 2 (z:    0): Hex Grid (body::after)
Layer 1 (z:    0): Radial Ambient Glows (body::before)
Layer 0:           Solid Background (body)
```

### 4.1 Radial Ambient Glows (body::before)

Sanfte, sich bewegende Farbblobs erzeugen ein lebendiges Gefühl.

```css
body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse at 20% 60%,
      color-mix(in srgb, var(--accent-primary) 8%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%,
      color-mix(in srgb, var(--accent-secondary) 6%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 90%,
      color-mix(in srgb, var(--accent-primary) 4%, transparent) 0%, transparent 50%);
  animation: drift 25s ease-in-out infinite alternate;
}

@keyframes drift {
  0%   { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(-15px, 8px); }
}
```

**Regel:** `color-mix(in srgb, ...)` macht die Glows automatisch theme-sensitiv.

### 4.2 Hex Grid (body::after)

Das Hexagon-Grid ist das visuelle Signature-Element. SVG-basiert, animiert driftend, theme-farbig.

```css
@keyframes hex-drift {
  0%   { background-position: 0px 0px; }
  100% { background-position: 172px 148px; }
}

body::after {
  content: ''; position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
  background-size: 172px 148px;
  mix-blend-mode: screen;
  opacity: 0.18;
  filter: blur(4px);
  animation: hex-drift 25s linear infinite;
}
```

**SVG-Hexagon-Pattern** (theme-farbig, einmal pro Theme):
- Ember: `stroke="#f59e0b"` (Amber)
- Neon: `stroke="#0de8f5"` (Cyan)
- Light: `stroke="#0891b2"` (Blue), `opacity: 0.14`, `mix-blend-mode: multiply`

Jedes Tile enthält 5 überlappende Hexagons für nahtloses Tiling. Grid-Zelle: `172×148px`, `stroke-width: 3`.

### 4.3 Ember Particle System (Canvas)

Das Herzstück der Atmosphäre. Ein `<canvas id="ember-canvas">` über dem gesamten Viewport.

**Specs:**
- **Count:** 120 Partikel
- **Deaktiviert** auf Mobilgeräten (`max-width: 768px`) zur Performance
- **Theme-aware:** Farben wechseln mit Theme-Switcher in Echtzeit

**Partikel-Eigenschaften:**
| Property | Wert |
|----------|------|
| Radius normal | `0.3–1.8px` |
| Radius "big" (8% der Partikel) | `2–5px` |
| Vertikale Geschwindigkeit | `-0.2 bis -0.9 px/frame` (aufwärts) |
| Horizontale Drift | `±0.25 px/frame` |
| Twinkle-Rate | `0.01–0.04 pro Frame` |
| Opacity-Range | `0.25–0.85` |
| Fade-out nahe Top | Linear über 120px |

**Render-Effekte pro Partikel:**
1. **Core Dot** — gefüllter Kreis in Theme-Farbe
2. **Glow Halo** (nur "big"-Partikel) — RadialGradient, 5× Radius, `alpha*0.7`
3. **Upward Streak** — Linie in Bewegungsrichtung, `alpha*0.35`, `lineWidth: r*0.6`

**Farb-Sets per Theme:**
```javascript
ember: ['212,82,10', '201,151,42', '255,123,46', '255,180,80']
neon:  ['13,232,245', '168,85,247', '34,211,160', '13,232,245']
light: ['8,145,178',  '124,58,237',  '8,145,178',  '16,185,129']
```

**Partikel-Lifecycle:**
- Spawnen unten, steigen auf
- Bei `y < -20` → Reset ans untere Ende (seamless loop)
- Horizontaler Wrap bei `x < 0` / `x > W`

### 4.4 Scanlines Overlay

Klassischer CRT-Effekt. Extrem subtil — kaum wahrnehmbar aber atmosphärisch.

```css
.scanlines {
  position: fixed; inset: 0; pointer-events: none; z-index: 9998;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
}
```

- **Zeilenhöhe:** 4px (2px transparent + 2px dunkel)
- **Dunkel-Intensität:** `0.03` (kaum sichtbar, nur der Hauch)
- **Deaktiviert** auf Mobilgeräten

### 4.5 SVG Noise / Film Grain

Organische Textur über allem. Verhindert den "zu digital" Look.

```css
.noise-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 9997;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,...fractalNoise...");
  background-size: 256px 256px;
}
```

- SVG `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4">`
- Tile-Größe: 256×256px
- Opacity: `0.03` (subtiles Grain)

---

## 5. Component Tokens

### 5.1 Badges

```
badge-cyan:   bg rgba(13,232,245,0.12)  border rgba(13,232,245,0.3)  text #0de8f5
badge-violet: bg rgba(168,85,247,0.12)  border rgba(168,85,247,0.3)  text #a855f7
badge-green:  bg rgba(76,175,80,0.12)   border rgba(76,175,80,0.3)   text #4caf50
badge-amber:  bg rgba(245,158,11,0.12)  border rgba(245,158,11,0.3)  text #f59e0b
badge-red:    bg rgba(239,68,68,0.12)   border rgba(239,68,68,0.3)   text #ef4444
badge-ember:  bg rgba(212,82,10,0.10)   border rgba(212,82,10,0.4)   text #d4520a
```

### 5.2 Buttons

```
Primary:   bg var(--accent-ember) text #080d13  hover: glow + scale(1.02)
Secondary: border var(--glass-border-hot)  text var(--accent-ember)  bg transparent
Ember:     border rgba(212,82,10,0.3)  text #d4520a  bg rgba(212,82,10,0.06)
Danger:    border rgba(239,68,68,0.4)  text #ef4444
```

### 5.3 Status Indicators

```
● Online    var(--neon-green)  pulse animation
● Idle      var(--neon-amber)  steady
● Offline   var(--text-muted)  no glow
● Error     #ef4444            pulse animation
```

### 5.4 Stat Cards

```css
.stat-card-ember {
  box-shadow: inset 0 0 40px rgba(255,123,46,0.05);
}
.stat-card-ember:hover {
  box-shadow: inset 0 0 40px rgba(255,123,46,0.12),
              0 8px 32px rgba(255,123,46,0.15);
}
```

**Stat Counter:** Zahlen animieren beim Laden von 0 auf Zielwert (800ms, cubic ease-out).

### 5.5 Active Nav Indicator

```css
.nav-item.active::before {
  /* Pulsierender Balken links */
  animation: pulse-nav 2s ease-in-out infinite;
}
```

---

## 6. Animation Tokens

| Name | Duration | Easing | Verwendung |
|------|----------|--------|------------|
| `drift` | 25s | ease-in-out alternate | Ambient Radial Glows |
| `hex-drift` | 25s | linear infinite | Hex Grid Scroll |
| `rune-pulse` | — | ease-in-out | Rune/Icon-Elemente |
| `ember-shimmer` | 3s | linear infinite | Shimmer-Text, Hero |
| `pulse` | 2.5s | ease-in-out | Status Dots |
| `fade-in` | 0.3s | ease-out | Page Transitions |

**Hover-Transitions:** immer `0.2s ease` — nicht langsamer.
**Theme-Switch:** `background-color 0.3s`, `border-color 0.3s`, `color 0.2s` — alles smooth.

---

## 7. Editions — Intern vs. Public

### 7.1 Internal Hub (`server.py`)

- Vollständige Atmosphäre (alle 5 Background-Layer)
- Ember / Neon / Light Theme Switcher
- Mission Control, Cron Jobs, Terminal, Cameras, PRISM-Docs
- Sidebar mit Theme-Switcher + Status-Dot
- Barlow Condensed als Display Font

### 7.2 Public Site (`build.py` → Cloudflare Pages)

- Reduzierte Features (kein Terminal, keine Cameras, keine privaten Docs)
- Eigenes CSS-Set: `--neon-cyan: #00f0ff` (etwas heller)
- **Orbitron** als Display Font (statt Barlow Condensed)
- Square CSS Grid statt Hex Grid
- Hamburger-Menu für Mobile
- Öffentlich: Docs, News, Research

---

## 8. Logo & Identity

### PRISM Hub Wordmark
- Font: **Barlow Condensed 800** (intern) / **Orbitron 700** (public)
- Color: `var(--accent-primary)` (theme-adaptiv)
- Tracking: `0.15em`
- UPPERCASE: ja
- Glow: `text-shadow: 0 0 20px var(--rune-glow, rgba(13,232,245,0.6))`

### Icon
- Emoji: 🔮 (Crystal Ball / Prism)
- Animation: `rune-pulse` loop
- Filter: `drop-shadow(0 0 8px var(--accent-primary))`

### Tagline
```
// clay machine games // build // forge // play
```
- Font: JetBrains Mono, 0.8rem
- Color: `--text-secondary`
- Prefix `//` in `--accent-ember`

---

## 9. Voice & Tone (UI Copy)

| Element | Stil | Beispiel |
|---------|------|---------|
| Page Title | Kurz, CAPS, direkt | `MISSION CONTROL` |
| Subtitle | Slash-Style, lowercase | `// live feed // auto-refresh aktiv` |
| Empty State | Nüchtern, technisch | `no active sessions detected` |
| Error | Präzise, kein Drama | `connection refused — cam offline` |
| Success | Knapp | `synced ✓` |

**Verboten:** Ausrufezeichen, Marketing-Sprache, „Großartig!", Emojis im UI-Flow (nur in Navicons).

---

## 10. Do's & Don'ts

### ✅ Do
- Schwarzes Hintergrund als Basis
- `var(--accent-primary)` als primären Akzent (nicht hard-coded)
- Alle 5 Atmosphären-Layer aktiv halten
- Glassmorphism für Cards
- Mono-Font für alle Datenwerte
- Glows sparsam aber bewusst einsetzen
- Hex Grid + Partikel für lebendige Atmosphäre
- Scanlines + Noise für subtile CRT-Textur
- **8-Punkt-Grid-System** für alle Abstände (`8px`, `16px`, `24px`, `32px`, `48px`)
- **`corner-shape: bevel`** (+ clip-path Fallback) für authentische Sci-Fi-Terminal-Ecken
- **`@media (prefers-reduced-motion)`** implementieren — immer
- **Klare Typografie-Hierarchie** mit mindestens 2 unterschiedlichen Schriftgrößen pro UI-Ebene

### ❌ Don't
- Weiße oder helle Hintergründe (außer Light Theme)
- Mehr als 2 Neon-Farben gleichzeitig prominent
- Fette Farbflächen (nur Akzente)
- Hard-coded Farb-Hex-Codes — immer `var(--...)` nutzen
- Partikel-Canvas auf Mobile (Performance)
- Serifenschriften
- Schatten ohne Farbe (nur Glow, kein grauer Box-Shadow)
- **Identische Schriftgrößen** für Haupt- und Unterkategorien
- **Schlechte Kontraste** — z. B. roter Text auf rotem Panel (WCAG-konform bleiben)
- **Font-Stacks ohne Fallback** — niemals nur ein einziges Font-Face angeben

---

## 11. CSS Quick Reference

```css
/* ─── Theme-Switcher (auf <html> element) ─── */
/* data-theme="ember" | "neon" | "light" */

:root {
  /* Backgrounds */
  --bg-void:    #080d13;
  --bg-base:    #0c1214;
  --bg-surface: #141b20;
  --bg-elevated:#1c2830;

  /* Theme-adaptive Accents (ändern sich per Theme) */
  --accent-primary:   #d4520a;   /* Haupt-Akzent */
  --accent-secondary: #c9972a;   /* Sekundär-Akzent */
  --accent-ember:     #d4520a;   /* Ember-spezifisch */
  --accent-gold:      #c9972a;   /* Gold/Shimmer */
  --rune-glow:        #ff7b2e;   /* Glow-Farbe für Animationen */

  /* Static Neon (nicht theme-dependent) */
  --neon-cyan:   #0de8f5;
  --neon-violet: #a855f7;
  --neon-green:  #4caf50;
  --neon-amber:  #f59e0b;
  --neon-red:    #ef4444;

  /* Glow */
  --glow-primary: 0 0 20px rgba(212, 82, 10, 0.3);
  --glow-ember:   0 0 20px rgba(212, 82, 10, 0.3);
  --glow-soft:    0 0 40px rgba(212, 82, 10, 0.08);

  /* Text */
  --text-primary:   #e0ddd5;
  --text-secondary: #8a8578;
  --text-muted:     #5a5548;

  /* Glass */
  --glass-bg:         rgba(12, 18, 20, 0.96);
  --glass-border:     rgba(212, 82, 10, 0.12);
  --glass-border-hot: rgba(212, 82, 10, 0.40);

  /* Fonts */
  --font-display: 'Barlow Condensed', sans-serif;
  --font-sans:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

---

## 12. Background Layer Stack (Implementierung)

```html
<!-- In jedem Page-Template -->
<canvas id="ember-canvas"></canvas>   <!-- Layer 3: Partikel -->
<div class="scanlines"></div>          <!-- Layer 5: Scanlines -->
<div class="noise-overlay"></div>      <!-- Layer 4: Grain -->

<!-- body::before = Layer 1 (Radial Glows) via CSS -->
<!-- body::after  = Layer 2 (Hex Grid) via CSS -->
```

```css
#ember-canvas {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
}
/* Deaktiviert auf Mobile */
@media (max-width: 768px) {
  #ember-canvas { display: none; }
  .scanlines    { display: none; }
}
```

---

*PRISM Hub Brand Bible v2.1 — Clay Machine Games — 2026*
*Erstellt von PRISM 🔮 — v2.1: 8pt-Grid, Thematic Eras, corner-shape, contrast rules, prefers-reduced-motion*
