---
name: Ziwei Natal Chart
description: A calm, monochrome night with one fixed point of gold.
colors:
  night-black: "#000000"
  graphite: "#101820"
  graphite-raised: "#1C232B"
  graphite-glass: "rgba(16, 24, 32, 0.72)"
  starlight: "#FFFFFF"
  starlight-dim: "rgba(255, 255, 255, 0.6)"
  hairline-night: "rgba(255, 255, 255, 0.15)"
  pole-star-gold: "#C8A464"
  pole-star-gold-day: "#836425"
  day-white: "#FFFFFF"
  day-mist: "#F4F4F4"
  day-mist-raised: "#F0F0F0"
  day-ink: "#000000"
  day-ink-dim: "rgba(0, 0, 0, 0.6)"
  hairline-day: "#D8D8D8"
  sihua-lu: "#6CC08E"
  sihua-quan: "#86A8F0"
  sihua-ke: "#D58FD0"
  sihua-ji: "#EC7A6E"
  sihua-lu-day: "#2D7A4A"
  sihua-quan-day: "#1A56A8"
  sihua-ke-day: "#8C3A8C"
  sihua-ji-day: "#A83228"
typography:
  display:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "clamp(48px, calc(40px + 5vw), 110px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  read:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "25px"
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  caption:
    fontFamily: "Helvetica Neue, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  mono:
    fontFamily: "SF Mono, Menlo, Noto Sans Mono, Consolas, monospace"
rounded:
  none: "0px"
  xs: "2px"
  pill: "999px"
spacing:
  gutter-phone: "16px"
  gutter-tablet: "48px"
  gutter-desktop: "112px"
  control: "52px"
  control-sm: "44px"
  nav: "72px"
  page-max: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.starlight}"
    textColor: "{colors.night-black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "{spacing.control}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.starlight}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "{spacing.control}"
  button-ghost-pressed:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.starlight}"
  button-sm:
    typography: "{typography.label}"
    padding: "10px 16px"
    height: "{spacing.control-sm}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.starlight}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.control}"
  nav:
    backgroundColor: "{colors.night-black}"
    textColor: "{colors.starlight}"
    height: "{spacing.nav}"
  card:
    backgroundColor: "{colors.graphite-glass}"
    rounded: "{rounded.none}"
  sihua-badge:
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: "0 4px"
---

# Design System: Ziwei Natal Chart

## Overview

**Creative North Star: "The Pole Star at Night"**

A calm, monochrome night with one fixed point of gold. The brand's only symbol is the pole star, a thin ring around a gold dot. In Chinese astronomy, Ziwei is the emperor's star by the celestial pole, so the mark and the name come from the same place.

Night is the default theme: pure black surfaces, with white text at full or 60% strength. Day mode is the same system on white. Hierarchy comes from size and opacity, never from weight, which is only 400 or 600. Edges are 1px hairlines and corners are square; only the small sihua badges round to 2px. Controls are 52px tall, the nav is 72px, and page gutters grow from 16px to 112px.

Motion is short and quiet: 200ms for interaction and 600ms for reveals, on one easing curve, moving opacity and stroke only. The one exception is the home page's night sky, which turns slowly around the pole star. All motion turns off when the system asks for reduced motion.

Gold is reserved for chart meaning: the star names, the Life Palace, the current decade, the trine-and-opposition lines and the AI reading headers. Wherever it appears, it says "this matters in your chart". The sihua keep their own four colors, always paired with their character.

The specs were measured after polestar.com's web pages in November 2026. None of its logo, fonts, imagery or copy is used. Chinese typesetting follows Apple's China site: PingFang SC at normal tracking.

**Key Characteristics:**
- Monochrome surfaces with one gold accent, kept for chart meaning only.
- Square corners and 1px hairlines; no rounded cards.
- Hierarchy from size and opacity; two weights only (400, 600).
- Flat: depth comes from tonal panels, not shadows.
- Quiet motion: opacity and stroke only, 200ms and 600ms on one curve; the home sky's slow turn around the pole star is the one exception.
- Night by default; day mode mirrors it on white.

## Colors

A monochrome system with one gold and four semantic sihua colors. Every color is a token in `app/globals.css`, defined for both themes. Components never write hex or rgba values; `tests/unit/design/no-drift.test.ts` enforces this.

### Primary
- **Pole-Star Gold** (night `#C8A464`, day `#836425`): the only accent. It marks:
  - main star names;
  - the Life Palace and its badge;
  - the current decade's ages and its 3px edge bar;
  - the trine-and-opposition lines on the board;
  - the AI reading headers;
  - the dot in the pole-star mark.

  Its border and background tints (`--ac-bdr`, `--ac-bg`) are 32% and 8% alpha versions of the same gold.

### Secondary
- **Sihua Lu Green** (night `#6CC08E`, day `#2D7A4A`): hualu markers.
- **Sihua Quan Blue** (night `#86A8F0`, day `#1A56A8`): huaquan markers.
- **Sihua Ke Violet** (night `#D58FD0`, day `#8C3A8C`): huake markers.
- **Sihua Ji Red** (night `#EC7A6E`, day `#A83228`): huaji markers, and form errors.

Tailwind's color families map onto these five tokens: amber, purple, violet, indigo and fuchsia to gold; emerald, green and lime to lu; and so on. A stray Tailwind color class still lands on the system.

### Neutral
- **Night Black** (`#000000`): the night page and nav.
- **Graphite** (`#101820`): the raised surface for panels and the reading panel.
- **Graphite Raised** (`#1C232B`): hover and pressed fills, and the user's chat bubble.
- **Graphite Glass** (`rgba(16, 24, 32, 0.72)`): night cards, with a 10px backdrop blur.
- **Starlight** (`#FFFFFF`): night text at full strength, and the primary button's fill.
- **Starlight Dim** (`rgba(255, 255, 255, 0.6)`): secondary text, labels and captions at night.
- **Hairline Night** (`rgba(255, 255, 255, 0.15)`): every border and divider at night.
- **Day White / Day Mist / Day Ink / Day Ink Dim / Hairline Day** (`#FFFFFF`, `#F4F4F4`, `#000000`, `rgba(0, 0, 0, 0.6)`, `#D8D8D8`): the same roles in day mode.

### Named Rules
**The One Gold Rule.** Gold appears only where the chart means something. Buttons, navigation, links and selected states stay monochrome. If you can remove the gold without losing chart information, it shouldn't be gold.

**The Character Pairing Rule.** A sihua color never stands alone. Every marker also carries its character (禄, 权, 科, 忌), so color is never the only signal.

**The Contrast Floor Rule.** Text keeps at least 4.5:1 contrast in both themes. `tests/unit/design/design-system.test.ts` checks every text and background pair.

## Typography

**Display Font:** Helvetica Neue, with Helvetica, Arial and the CJK stack below.
**Body Font:** the same family. Chinese falls through to PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC and Noto Sans CJK SC.
**Label/Mono Font:** SF Mono, Menlo and Noto Sans Mono, for code and data only.

**Character:** a single neutral grotesque for Latin and digits, with the platform's own Chinese face. It reads like an instrument panel, plain and even, and lets size and spacing carry the hierarchy.

### Hierarchy
- **Display** (400, `clamp(48px, calc(40px + 5vw), 110px)`, line height 1, `0.04em`): the home page title only.
- **Headline** (400, 30px, line height 1.25): page titles and section headings.
- **Read** (400, 17px, 25px line height): long reading text.
- **Body** (400, 16px, line height 1.5): default text and controls. Inputs stay at 16px so iOS doesn't zoom.
- **Label** (400, 14px): section labels, small buttons and meta text.
- **Caption** (400, 12px): the smallest size allowed. Used for sihua badges and footnotes.

### Named Rules
**The Two Weights Rule.** Only 400 and 600 exist; Tailwind's weight scale is remapped onto them. Use 600 for strong emphasis and the AI reading headers, and nothing heavier.

**The 12px Floor Rule.** No text is smaller than 12px.

**The Normal Tracking Rule.** Chinese stays at normal letter spacing. Only the display title takes a little air (`0.04em`), and nothing exceeds `0.08em`.

## Layout

One page grid for everything. The `.page` container is at most 1440px wide, and its side gutter grows with the screen:
- 16px on phones;
- 48px from 744px;
- `min(7.78vw, 112px)` from 1024px.

The nav, the hero, every home section, the chart and the compatibility page all align to that gutter. The nav is 72px tall and sticks to the top.

The chart page stacks the board above the reading panel on phones and sets them side by side from 1024px. Reading pages (the library, knowledge index, chapters and the About Ni Haixia page) are left-aligned and hold text to about 720px. Section rhythm comes from 1px top rules and generous vertical padding, not from boxes.

## Elevation & Depth

Flat by default. Depth comes from tonal layers (black, graphite, graphite raised), not shadows. The shared card shadow token is `none`. Night cards use a translucent graphite with a 10px backdrop blur over the star field. The star field itself sits at 60% opacity at night and 30% by day.

### Named Rules
**The Flat-By-Default Rule.** Surfaces don't cast shadows. To separate a layer, step up a tone or add a hairline.

## Shapes

Square corners everywhere: buttons, inputs, cards, panels and tiles are all 0px. The only exceptions:
- the small sihua badges (2px);
- circles that are meant to be circles: the pole-star mark, the theme switch and avatars.

Borders are 1px hairlines in the theme's line color. A heavier full-contrast 1px border marks the ghost button and selected states.

## Components

### Buttons
Square, monochrome and quiet: they press by dimming, never by moving.
- **Shape:** square (0px), 52px tall.
- **Primary:** white on black at night and black on white by day, padded 16px by 24px at 16px. Hover drops to 80% opacity, and pressing drops to 72%.
- **Ghost:** transparent with a full-contrast 1px border. Hover fills it with Graphite Raised. When it is a toggle and pressed (`aria-pressed="true"`), it keeps that fill with a full-contrast border; unpressed, it uses the dim border and dim text.
- **Small:** 44px tall, padded 10px by 16px, at 14px.
- **Disabled:** 40% opacity with a not-allowed cursor.
- **Focus:** a 2px outline in the text color, offset 2px, on every interactive element.

### Inputs / Fields
- **Style:** transparent, with a 1px hairline, square corners and 52px height, at 16px.
- **Hover / Focus:** the border steps to dim text on hover and to full text on focus.
- **Error:** the border and a 12px message turn Sihua Ji Red, and the message starts with a cross mark.

### Navigation
- **Style:** one sticky nav in the layout, 72px tall, on the page background and aligned to the page gutter.
- **Left:** the pole-star mark and the site name.
- **Right:** text links for building a chart (起盘) and compatibility (合盘), the language switch and the day/night switch.
- **States:** links dim to 60% on hover. The language switch shows the other language in that language (EN / 中文), so its visible text is its name.

### Cards / Containers
- **Corner Style:** square (0px).
- **Background:** Graphite Glass at night, white by day.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** a 1px hairline.
- **Internal Padding:** 24px for tiles; reading panels use 20px.

### Sihua Badge
Small inline markers on the board. Each carries its character in its own sihua color, with a 1px border in the same color, 2px corners and 12px type.

### Pole-Star Mark
The brand's only symbol: an 18px ring in the 32% gold border with a gold dot in the middle. It appears in the nav and as the reading panel's loading state, where it breathes on a 6s cycle. The home hero shows it at 36px, and the night sky turns around it.

### Night Sky (home)
The star field behind the home page turns around the pole-star mark in the hero. When the mark scrolls off the top, the centre goes with it, so the stars sweep in arcs like a long-exposure photograph.

**The Turning Sky Rule.** The sky turns slowly at rest. Scrolling through the first screen speeds it up and leaves short trails; past the first screen it settles back to a calm turn. It is the site's only motion that isn't opacity or stroke, it always sits behind the content, and it stops under reduced motion.

### Chart Walkthrough (home)
A sample chart, worked out in the browser from a made-up birthday, pinned beside four steps that scroll past: the Life Palace, its sanfang sizheng, the birth-year Four Transformations, and the current decade. It reuses the chart page's palace cells and sanfang lines, so it looks exactly like `/chart`. The palaces a step is about stay at full strength and the rest dim to 30%. Below 1024px it stacks, unpinned, with every highlight shown at once.

### Chart Reveal (chart page)
When a chart is built, the board lays itself out the way the rules do:
- the Life Palace appears first, on its own for 150ms;
- the other eleven follow one branch back at a time, one every 40ms. That is the traditional palace order, counterclockwise on the board;
- the Life Palace's sanfang sizheng lines and dots draw next;
- the current decade's gold edge appears last.

Each piece fades or draws over 600ms, and everything is in place within 1.4s. It runs once per chart and never blocks a click; picking a palace later draws its lines at once. Under reduced motion the whole board is simply there. The timing lives in `lib/design/chart-reveal.ts`.

### Reading Panel
Streamed AI text sits in an `aria-live="polite"` region. Section headers are 14px at weight 600 in Pole-Star Gold, and paragraphs are 16px body text. While a reply is on its way, the pole-star mark breathes next to a line that says what is being read and names that palace's major stars with their sihua ("Reading the Life Palace: Taiyang (Hualu) and Taiyin (Huake)…"). An empty palace gets the line without stars.

## Do's and Don'ts

### Do:
- **Do** take every color, radius, shadow and duration from the tokens in `app/globals.css`.
- **Do** keep gold for chart meaning: star names, the Life Palace, the current decade, the trine-and-opposition lines and the AI reading headers.
- **Do** pair every sihua color with its character label.
- **Do** build hierarchy with size (12, 14, 16, 17, 30px and display) and opacity (100% and 60%).
- **Do** use `.btn-primary`, `.btn-ghost` and `.input-base` for every button and input, at 52px (44px for small buttons).
- **Do** use 200ms for interaction and 600ms for reveals on `cubic-bezier(0.15, 1, 0.35, 1)`, and turn motion off under `prefers-reduced-motion`.

### Don't:
- **Don't** write hex or rgba values in components.
- **Don't** use gold on buttons, navigation, links or selected states.
- **Don't** round corners, except the 2px sihua badges and true circles.
- **Don't** add shadows to cards or panels.
- **Don't** use weights other than 400 and 600, or text smaller than 12px.
- **Don't** scale or lift elements on hover or press. Pressing dims, nothing moves.
- **Don't** add a second ambient motion. The turning sky is the only one.
- **Don't** widen Chinese letter spacing.
- **Don't** use Polestar's logo, fonts, imagery or copy. Only its measured specs informed this system.
