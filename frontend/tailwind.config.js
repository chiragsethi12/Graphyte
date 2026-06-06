/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0A0A0F",       // Root background
          elevated: "#111118",   // Cards, panels
          overlay: "#16161E",    // Modals, dropdowns
          hover: "#1C1C27",      // Hover states
          active: "#22222F",     // Selected states
        },
        accent: {
          DEFAULT: "#99004C",    // Primary CTA, links (maroon)
          hover: "#800040",
          muted: "#2A0015",      // Subtle accent bg
          light: "#FFE5F1",
          200: "#FFAAD4",
        },
        brand: {
          DEFAULT: "#660033",    // Logo, secondary brand
          muted: "#1A000D",
          light: "#FFE4EF",
        },
        text: {
          primary: "#F8FAFC",
          muted: "#94A3B8",
          faint: "#475569",
        },
        border: {
          DEFAULT: "#1E1E2E",
          muted: "#27273A",
          accent: "#3D1A5E",
        },
        semantic: {
          success: "#10B981",
          warning: "#F59E0B",
          destructive: "#F43F5E",
          info: "#06B6D4",
        },
      },
      fontFamily: {
        display: ["Geist", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px", DEFAULT: "6px", md: "8px",
        lg: "10px", xl: "12px", "2xl": "16px",
        "3xl": "24px", full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.4)",
        DEFAULT: "0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
        md: "0 4px 16px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3)",
        lg: "0 8px 32px rgba(0,0,0,0.7)",
        "glow-accent": "0 0 0 1px rgba(153,0,76,0.3), 0 4px 16px rgba(153,0,76,0.15)",
      },
    },
  },
  plugins: [],
};