/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          subtle: "var(--primary-subtle)",
        },
        sidebar: {
          bg: "var(--sidebar-bg)",
          text: "var(--sidebar-text)",
        },
        kraft: "var(--kraft)",
        status: {
          ok: "#1B6B3A",
          "ok-bg": "#E3F3E8",
          warning: "#8A5A00",
          "warning-bg": "#FBF0D6",
          danger: "#A3271C",
          "danger-bg": "#FBE4E1",
          expiring: "#9A4A0B",
          "expiring-bg": "#FDE9D6",
          info: "#24527A",
          "info-bg": "#E4EEF7",
          neutral: "#4B544F",
          "neutral-bg": "#ECE9E1",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      borderRadius: {
        chip: "4px",
        btn: "6px",
        input: "6px",
        card: "8px",
      },
      boxShadow: {
        dialog: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        dropdown: "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};
