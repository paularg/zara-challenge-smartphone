---
version: alpha
name: MBST Smartphone Store
description: A flat, monochrome and product-led commerce system reconstructed from the Figma Design page at 393px, 834px and 1920px reference widths.
colors:
  primary: "#000000"
  on-primary: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#000000"
  action: "#1B1A18"
  action-hover: "#282624"
  action-active: "#363331"
  text-hover: "#504D49"
  text-muted: "#79736D"
  placeholder: "#79736D"
  border: "#000000"
  border-subtle: "#CCCCCC"
  disabled-surface: "#F3F2F2"
  disabled-border: "#DBD9D7"
  disabled-text: "#C2BFBC"
  danger: "#DF0000"
  brand-accent: "#EC1D24"
  swatch-graphite: "#62605F"
  swatch-blue: "#4D4E5F"
  swatch-grey: "#ACA49B"
  swatch-gold: "#F0E1B9"
typography:
  display-product:
    fontFamily: Helvetica Neue
    fontSize: 24px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0em
  heading-section:
    fontFamily: Helvetica Neue
    fontSize: 20px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0em
  input-lg:
    fontFamily: Helvetica Neue
    fontSize: 16px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0em
  option-md:
    fontFamily: Helvetica Neue
    fontSize: 14px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0em
  total-md:
    fontFamily: Helvetica Neue
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0em
  body-sm:
    fontFamily: Helvetica Neue
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: 0em
  label-sm:
    fontFamily: Helvetica Neue
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: 0em
  button-label:
    fontFamily: Helvetica Neue
    fontSize: 12px
    fontWeight: 300
    lineHeight: 16px
    letterSpacing: 0.08em
  eyebrow-xs:
    fontFamily: Helvetica Neue
    fontSize: 10px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0em
rounded:
  none: 0px
spacing:
  none: 0px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  3xl: 40px
  4xl: 48px
  5xl: 64px
  6xl: 80px
  page-mobile: 16px
  page-tablet: 40px
  page-desktop: 100px
components:
  header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    height: 80px
    rounded: "{rounded.none}"
  search:
    textColor: "{colors.on-surface}"
    placeholderColor: "{colors.placeholder}"
    typography: "{typography.input-lg}"
    height: 27px
    borderBottom: "0.5px solid {colors.border}"
    rounded: "{rounded.none}"
  product-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    mutedTextColor: "{colors.text-muted}"
    border: "0.5px solid {colors.border}"
    rounded: "{rounded.none}"
    padding: 16px
    gap: 24px
    height: 344px
  product-card-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    mutedTextColor: "{colors.border-subtle}"
    border: "0.5px solid {colors.border}"
    rounded: "{rounded.none}"
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-label}"
    rounded: "{rounded.none}"
    paddingInline: 32px
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.on-primary}"
  button-primary-active:
    backgroundColor: "{colors.action-active}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"
  button-standard:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    border: "0.5px solid {colors.action}"
    typography: "{typography.button-label}"
    rounded: "{rounded.none}"
    paddingInline: 32px
  button-standard-disabled:
    backgroundColor: transparent
    textColor: "{colors.disabled-text}"
    border: "0.5px solid {colors.disabled-border}"
  color-option:
    size: 24px
    swatchSize: 20px
    border: "1px solid {colors.border-subtle}"
    rounded: "{rounded.none}"
  color-option-selected:
    size: 24px
    swatchSize: 20px
    border: "1px solid {colors.border}"
    rounded: "{rounded.none}"
  storage-option:
    textColor: "{colors.on-surface}"
    typography: "{typography.option-md}"
    border: "1px solid {colors.border-subtle}"
    rounded: "{rounded.none}"
    width: 95px
    height: 65px
  storage-option-selected:
    textColor: "{colors.on-surface}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.none}"
---

# MBST Smartphone Store Design System

## Overview

The interface is a deliberately restrained smartphone catalogue and checkout experience. Its visual identity comes from pure white space, black typography, hairline rules, sharp rectangular controls and large, isolated product photography. It should feel like an editorial product sheet: quiet, exact and utilitarian rather than decorative or promotional.

The hierarchy is carried by scale, spacing, alignment and borders. Color is almost absent from the interface itself; it belongs primarily to the phone photography and selectable material swatches. Most copy is small, light and uppercase. Large headings remain light rather than becoming bold.

This document was reconstructed from the [Figma file **Labs — Zara Web Challenge (Smartphones)**](https://www.figma.com/design/VdsDHrO5kzCWE4tplpRnLP/Labs---Zara-Web-Challenge--Smartphones---Copia-), specifically the `Design` page and its `Desktop`, `Tablet` and `Mobile` sections, with reusable values cross-checked against the `Resources` page. Its structure follows the [DESIGN.md format specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). The canonical reference canvases are 1920×1080/2364, 834×1194/1890 and 393×852/2243. The Figma nodes, not the current Vite starter styles, are the visual source of truth.

Figma contains a few scratch variables, canvas-only colors and hidden logo construction layers. They are not product tokens. The values above come from visible UI nodes and component variants. The red `brand-accent` is reserved for the supplied brand artwork; it is not a general interaction color.

## Colors

The palette is monochrome and high contrast. White is both the page and component surface. Pure black is the default text, divider and card-border color. Near-black steps are used only to distinguish button interaction states without changing the character of the interface.

- **Black / white:** Use `primary`, `on-primary`, `surface` and `on-surface` for the dominant two-tone composition.
- **Action neutrals:** Primary controls progress from `action` (#1B1A18) to `action-hover` (#282624) and `action-active` (#363331). Do not substitute a colored brand CTA.
- **Muted information:** Product brand eyebrows and Search placeholders use `text-muted` / `placeholder` (#79736D), preserving WCAG AA contrast on white.
- **Rules and disabled states:** Use black 0.5px rules for structural boundaries, #CCCCCC for unselected control borders, and the dedicated disabled surface/border/text trio.
- **Destructive action:** `danger` (#DF0000) is used for delete/remove copy, not as a filled destructive button in the observed screens.
- **Product swatches:** Graphite, blue, grey and gold are content data. Keep them inside the 20px swatch, surrounded by a 24px square selection control.

There are no gradients in the product UI. Do not introduce dark mode: every reference screen is explicitly light with a white background.

## Typography

**Helvetica Neue Light (300)** is the primary interface voice. Regular (400) appears sparingly for totals. The type system depends on light weight, uppercase transformations and very small sizes; replacing it with a heavier generic sans changes the design substantially.

| Role | Token | Treatment |
| --- | --- | --- |
| Product and cart heading | `display-product` | 24px, weight 300, generally uppercase |
| Section heading and price | `heading-section` | 20px, weight 300; section titles uppercase |
| Search input and bag count | `input-lg` | 16px, weight 300 |
| Storage option | `option-md` | 14px, weight 300 |
| Cart total | `total-md` | 14px, weight 400, uppercase |
| Product name, price and body data | `body-sm` | 12px, weight 300 |
| Result count, filter and specification labels | `label-sm` | 12px, weight 300, uppercase |
| Button label | `button-label` | 12/16px, weight 300, uppercase, 0.08em tracking |
| Product brand eyebrow | `eyebrow-xs` | 10px, weight 300, uppercase, muted |

Figma uses **Auto** line height for most Helvetica Neue text. The YAML tokens normalize that to 1.2–1.25 for portable implementation; the button label is explicitly 16px. Preserve the compact visual bounds and verify rendered text against Figma when the actual font is available.

The MBST wordmark is artwork, not a heading. Its internal construction uses ABC Monument Grotesk Bold with custom, uneven negative tracking; always render the supplied vector rather than recreating it with live text. `Neue Helvetica for Zara` appears in internal/legacy component layers but is not the dominant visible interface family.

If Helvetica Neue cannot legally be bundled, use `Arial, sans-serif` only as a temporary fallback and expect metric differences. Do not treat the fallback as a pixel-perfect match.

## Layout

The layout is mobile-first but defined by three exact Figma reference widths. The outer edge padding and catalogue column count change together:

| Reference | Canvas | Page edge | Catalogue grid | Card geometry |
| --- | --- | --- | --- | --- |
| Mobile | 393px | 16px | 1 column | 361×344px |
| Tablet | 834px | 40px | 2 columns | 377×377px |
| Desktop | 1920px | 100px | 5 columns | 344×344px |

The grid has no gutters: neighbouring 0.5px card borders meet directly. Cards wrap on desktop/tablet and stack vertically on mobile. Preserve `overflow: hidden` at the viewport/frame level and clip horizontally scrolling carousels to their content width.

Core layout rules:

- The header is always 80px high with 24px vertical padding. Horizontal padding is 16px mobile, 40px tablet and 100px desktop.
- Catalogue content begins below the header. Desktop/tablet use 48px top space and a 48px gap between search controls and grid; mobile uses 24px for both.
- The search/results wrapper uses 12px vertical padding and the current page-edge padding. The input is full width with an 8px bottom inset and a 0.5px bottom border.
- Major vertical groups use 40px, 48px, 64px or 80px gaps. Micro-layout uses 4px, 8px, 11px, 12px, 16px, 20px, 24px and 32px.
- Use fixed, deliberate content widths instead of floating cards or generic max-width panels.

### Product detail

- **Desktop:** Center a 1200px content column. The hero row is 1200×630px, with a 510×630px image region, a 380px information column and 170px separation. Specifications and similar items also use the 1200px column.
- **Tablet:** Use the 754px inner width. Keep image and information side by side in the hero, then place specifications and similar items below.
- **Mobile:** Use the 361px inner width and stack image above information. The product block is 695px high, major sections are separated by 80px, and specifications/similar items retain 40px internal section spacing.
- The back row is 44px high below the 80px header. It uses a 20px chevron, 4px gap and the active page-edge padding.

### Cart

- Keep the cart title near the top of the content and the checkout actions anchored to the bottom of the reference viewport.
- Desktop uses a 136px footer with 100px side padding and 260×56px actions. Tablet uses a 112px footer with 40px side padding.
- Mobile uses a 129px filled-cart footer: a full-width total row, 24px vertical gap and two equal 174.5×48px buttons separated by 12px. The empty cart footer is 96px high and contains one full-width 361×48px continuation button.
- The mobile cart item is 361×197.863px: a 160px-wide image, a 24px gap and a 177px information/delete column.

Treat 393px, 834px and 1920px as the canonical visual checkpoints. Intermediate breakpoints should switch only when the next column pattern and its edge padding fit without shrinking the observed card content below its intended geometry.

## Elevation & Depth

The system is completely flat. Figma contains no visible shadow or blur effects on the `Design` page.

Hierarchy comes from:

- 0.5px black card and control borders;
- 1px separators and carousel tracks;
- foreground/background inversion on hover;
- large blocks of white space;
- clipped overflow and alignment, not floating layers.

Do not add box shadows, translucent glass, gradients, raised cards or layered tinted surfaces.

## Shapes

The product UI uses **0px corner radius** throughout. Cards, buttons, search rules, storage options, color selectors, headers and footers are square and architectural. The only 2px radius values found on the `Design` page belong to Figma section/canvas containers, not rendered interface elements.

Use these stroke weights precisely:

- 0.5px for product cards, standard buttons and fine structural rules;
- 1px for color/storage selection borders and carousel tracks;
- no enclosing border around the page, header or major content sections.

Product images retain their own photographic silhouettes and aspect ratios. Do not mask them into rounded cards or circles.

## Components

### Header

The header is a white, 80px-high horizontal bar. The MBST vector sits on the left at roughly 74×24px. The bag control sits on the right, combining an 18×18px bag glyph, a 6px gap and a 16px Light uppercase count. On cart screens the logo remains the dominant header element; match the exact Figma alignment for each state.

### Search and result summary

The search field is only a text row and bottom hairline—never a filled or rounded input. Empty text is #79736D so it retains WCAG AA contrast on white; entered text is black. The result count sits beneath it in 12px uppercase. A filter/color region exists in the desktop composition but is hidden at zero opacity in the observed catalogue state; do not expose it unless the product behavior requires it.

### Product card

Cards use a 0.5px black border, 16px padding and a 24px gap between the image area and information row. The image is centered and uses the source asset's natural aspect ratio with contain-style fitting; different phones intentionally occupy different proportions of the image region.

The information row places brand/name on the left and price on the right. Brand is 10px uppercase muted text, product name is 12px uppercase black, and price is 12px light text aligned to the lower right. Truncate long one-line values rather than wrapping the row.

On hover, invert the card to black: the product name and price become white, while the brand becomes #CCCCCC. The product image remains unchanged. Do not add scaling, shadow or rounded treatment.

### Buttons

All buttons are rectangular with 0px radius, centered uppercase 12/16px labels and 0.08em tracking. Width is controlled by the parent layout.

- **Primary:** #1B1A18 default, #282624 hover, #363331 active, white label.
- **Standard:** transparent with a 0.5px near-black border and black label. Hover shifts border to #282624 and label to #504D49; active uses #363331 border.
- **Disabled:** primary uses #F3F2F2 fill; standard uses a #DBD9D7 border. Both use #C2BFBC text.
- **Heights:** the component library supports 40px, 48px and 56px through 12px, 16px and 20px vertical padding. In composed screens, desktop primary/cart actions are 56px and tablet/mobile actions are 48px.
- Keep state changes tonal and immediate. No motion duration or easing is specified in Figma, so do not invent a pronounced animation.

### Storage options

Desktop options are 95×65px with 24px padding. Unselected options use a 1px #CCCCCC border; selected options use a 1px black border. Tablet/mobile detail screens compact them to 48px height, with widths of approximately 89/89/95px to fill the 273px selector row. Labels are 14px Light.

### Color options

Each selector is a 24×24px square containing a 20×20px product-color swatch. Unselected controls use a 1px #CCCCCC border; selected uses black. Options are arranged horizontally with 16px gaps. Keep the color name as nearby 10–12px supporting text rather than inside the swatch.

### Specification rows

Specification rows are separated by fine horizontal rules and use 16px vertical padding. Desktop uses a 48px gap between label and value columns; narrow layouts use 12px. Rows grow vertically for long values instead of clipping them. Labels are uppercase 12px Light; values are 12px Light and preserve readable wrapping.

### Similar-items carousel

The carousel reuses catalogue cards in a single horizontal row with no gap. It is clipped to the content column. A 1px #CCCCCC track sits 41px below the cards, with a black progress thumb (150px desktop, 100px mobile in the reference). Do not convert this into floating cards or add navigation chrome not shown in Figma.

### Cart item and footer

Desktop/tablet cart items use the reusable 548×324px composition and may stretch to the tablet inner width. The hover variant inverts the information region in the same monochrome spirit as product cards. Mobile uses the compact custom 361×197.863px row described in Layout. Delete text is the only red interaction copy.

The footer is flush to the viewport bottom, white, square and shadowless. Filled carts show total plus continuation/payment actions; empty carts hide total/payment and expand continuation to the full inner width.

### Icons and imagery

Use the supplied MBST wordmark, bag glyph and chevron assets. Do not redraw or substitute them with a generic icon set. Product imagery is the visual focus: use the exact phone cutouts, preserve transparent/background treatment and tune contain/crop per asset as in Figma rather than applying one global image rule.

## Do's and Don'ts

- **Do** keep the interface almost entirely black and white; let phone imagery provide color.
- **Do** use Helvetica Neue Light as the dominant face and reserve Regular for the cart total.
- **Do** reproduce the 5/2/1 catalogue grid and 100/40/16px page-edge progression.
- **Do** preserve 0.5px borders, zero-radius corners and exact 80px headers.
- **Do** use uppercase for navigation labels, product metadata, section headings and button labels.
- **Do** keep visible keyboard focus equally sharp and high contrast; a black 1–2px outline with a small offset is compatible with the system even though focus frames are not shown in Figma.
- **Do** use English interface copy per repository conventions while preserving the casing and typographic treatment shown in Figma.
- **Don't** add shadows, gradients, glass effects, pills, soft cards or decorative background colors.
- **Don't** introduce a general accent color for links or CTAs; red is limited to destructive copy and supplied brand artwork.
- **Don't** recreate the MBST wordmark with live text or replace product assets with placeholders.
- **Don't** make all product images the same percentage size; their varied silhouettes and source aspect ratios are intentional.
- **Don't** infer product tokens from the Figma canvas's purple component-set outlines, grey section backgrounds or unrelated blue scratch variables.
- **Don't** enable dark mode unless a new approved Figma design explicitly defines it.
