---
name: AgriPOS Design System
colors:
  surface: '#fbf8ff'
  surface-dim: '#d5d8f9'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2ff'
  surface-container: '#ececff'
  surface-container-high: '#e5e6ff'
  surface-container-highest: '#dee0ff'
  on-surface: '#161a32'
  on-surface-variant: '#414844'
  inverse-surface: '#2b2f48'
  inverse-on-surface: '#f0efff'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#1f6d1a'
  on-secondary: '#ffffff'
  secondary-container: '#a4f792'
  on-secondary-container: '#267320'
  tertiary: '#1f2825'
  on-tertiary: '#ffffff'
  tertiary-container: '#353e3a'
  on-tertiary-container: '#9fa9a3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#a4f792'
  secondary-fixed-dim: '#89da79'
  on-secondary-fixed: '#002201'
  on-secondary-fixed-variant: '#005303'
  tertiary-fixed: '#dbe5df'
  tertiary-fixed-dim: '#bfc9c3'
  on-tertiary-fixed: '#151d1a'
  on-tertiary-fixed-variant: '#3f4945'
  background: '#fbf8ff'
  on-background: '#161a32'
  surface-variant: '#dee0ff'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  table-data:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  status-label:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  table-cell-padding: 12px 16px
  input-height: 40px
---

## Brand & Style

This design system is built for the high-utility, fast-paced environment of agricultural retail and inventory management. The brand personality is grounded, reliable, and industrious—mirroring the resilience of the agricultural sector. 

The aesthetic follows a **Corporate / Modern** approach with a "sturdy" structural foundation. It prioritizes functional density over decorative whitespace, ensuring that agronomists and retail clerks can process large orders and monitor stock levels with minimal fatigue. The visual language utilizes heavy-duty borders and clear structural divisions to evoke a sense of professional-grade equipment, moving away from "soft" consumer tech trends toward a more utilitarian, "work-boot" reliability.

## Colors

The palette is derived from the natural lifecycle of crops and the industrial nature of modern farming. 

- **Primary (Deep Forest Green):** Used for navigation sidebars, primary action buttons, and structural headers to provide a sense of stability and authority.
- **Secondary (Sprout Green):** Used for accenting successful states, highlights, and growth-related metrics.
- **Neutral Earthy Grays:** A range of warm-toned grays used for backgrounds and borders to reduce eye strain compared to stark blacks or cool blues.
- **Status Indicators:** Specifically tuned for high glanceability in a warehouse or retail setting:
    - **Available:** Deep forest-inflected green.
    - **Low:** High-contrast amber/mustard.
    - **Empty:** Muted brick red to signal urgency without being abrasive.

## Typography

This design system utilizes **IBM Plex Sans** for its corporate-industrial heritage, providing exceptional legibility in data-heavy tables. Its technical, slightly engineered feel suits the "Agri" context perfectly.

For technical data—such as SKU numbers, stock counts, and weights—**JetBrains Mono** is employed. The monospaced nature ensures that columns of numbers align perfectly, allowing for faster scanning of inventory lists. All labels use a bold, capitalized style to differentiate them from editable data points.

## Layout & Spacing

The layout uses a **fixed grid** for the primary POS interface to ensure consistent placement of critical action buttons, while the data-management views utilize a **fluid grid** to maximize information density on wide monitors.

- **Grid:** 12-column layout with 16px gutters.
- **Density:** High density is favored. Table rows are kept compact (40px–48px height) to allow as many line items as possible to be visible above the fold.
- **Responsive:** On tablets, the sidebar collapses into a rail, and the "Cart" or "Transaction" summary sticks to the bottom of the viewport for easy thumb access.

## Elevation & Depth

To maintain a "sturdy" feel, this design system avoids soft, floating shadows. Instead, it uses **Tonal Layers** and **Low-contrast outlines**.

- **Level 0 (Surface):** Earthy light gray (#F4F4F2) for the main application background.
- **Level 1 (Card/Container):** White surfaces with a 1px solid border (#D1D1CB). No shadow.
- **Level 2 (Active/Interactive):** A very slight 2px vertical offset shadow with high spread and low opacity (5%) is used only for active modals to separate them from the background.
- **Separators:** Use 1px solid lines rather than whitespace to define boundaries, reinforcing the "functional tool" aesthetic.

## Shapes

The design system uses a **Soft** shape language. Elements feature a 4px corner radius (rounded-sm), which is just enough to prevent the UI from feeling sharp or hostile while maintaining the disciplined look of a professional tool. Large containers and buttons follow this 4px rule strictly to ensure a cohesive, "blocked-out" appearance.

## Components

- **Data Tables:** The core of the app. Rows should have alternating zebra striping (very faint earthy gray). Headers remain sticky. Stock levels are indicated by a colored vertical bar on the left edge of the cell.
- **Action Buttons:** Primary buttons are Solid Forest Green with white text. Secondary buttons are outlined in Forest Green. They should feel "heavy" with 2px borders.
- **Stock Chips:** Small, rectangular badges with rounded-sm corners. They use the status colors defined in the palette. "Low Stock" chips should include a warning icon.
- **Input Fields:** Use a 1px border that thickens to 2px on focus. Labels should be pinned to the top-left of the field border to save vertical space.
- **Quantity Pickers:** Large, easy-to-tap +/- buttons flanking a monospaced numeric input, designed for gloves or quick mouse-clicks.
- **Segmented Controls:** Used for switching between "Bulk," "Retail," and "Wholesale" pricing views, utilizing the primary green for the selected state.