/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "surface-tint": "#3f6653",
        "on-tertiary-container": "#9fa9a3",
        "secondary-fixed": "#a4f792",
        "primary-container": "#1b4332",
        "on-background": "#161a32",
        "surface-container-high": "#e5e6ff",
        "on-secondary": "#ffffff",
        "secondary-fixed-dim": "#89da79",
        "inverse-primary": "#a5d0b9",
        "on-tertiary-fixed": "#151d1a",
        "on-surface-variant": "#414844",
        "on-surface": "#161a32",
        "outline": "#717973",
        "surface": "#fbf8ff",
        "surface-container-low": "#f4f2ff",
        "error": "#ba1a1a",
        "secondary": "#1f6d1a",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#267320",
        "surface-container": "#ececff",
        "on-primary-fixed-variant": "#274e3d",
        "on-primary-fixed": "#002114",
        "inverse-surface": "#2b2f48",
        "secondary-container": "#a4f792",
        "inverse-on-surface": "#f0efff",
        "tertiary-fixed-dim": "#bfc9c3",
        "on-tertiary-fixed-variant": "#3f4945",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed-variant": "#005303",
        "tertiary-fixed": "#dbe5df",
        "error-container": "#ffdad6",
        "surface-bright": "#fbf8ff",
        "on-secondary-fixed": "#002201",
        "on-primary": "#ffffff",
        "background": "#fbf8ff",
        "surface-variant": "#dee0ff",
        "primary": "#012d1d",
        "tertiary": "#1f2825",
        "on-primary-container": "#86af99",
        "primary-fixed": "#c1ecd4",
        "outline-variant": "#c1c8c2",
        "tertiary-container": "#353e3a",
        "primary-fixed-dim": "#a5d0b9",
        "surface-dim": "#d5d8f9",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-container-highest": "#dee0ff"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "unit": "4px",
        "margin-page": "24px",
        "table-cell-padding": "12px 16px",
        "gutter": "16px",
        "input-height": "40px"
      },
      "fontFamily": {
        "table-data": ["IBM Plex Sans"],
        "status-label": ["IBM Plex Sans"],
        "label-caps": ["JetBrains Mono"],
        "headline-lg": ["IBM Plex Sans"],
        "body-lg": ["IBM Plex Sans"],
        "body-md": ["IBM Plex Sans"],
        "headline-md": ["IBM Plex Sans"]
      },
      "fontSize": {
        "table-data": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "status-label": ["13px", { "lineHeight": "16px", "fontWeight": "700" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700" }],
        "headline-lg": ["30px", { "lineHeight": "38px", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }]
      }
    }
  },
  plugins: [],
}
