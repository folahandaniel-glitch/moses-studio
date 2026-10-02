import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--c-accent-ink) / <alpha-value>)",
        accent2: "rgb(var(--c-accent2) / <alpha-value>)",
        accent3: "rgb(var(--c-accent3) / <alpha-value>)",
        footer: "rgb(var(--c-footer) / <alpha-value>)",
        precious: "rgb(var(--c-precious) / <alpha-value>)",
        ongoing: "rgb(var(--c-ongoing) / <alpha-value>)",
        ready: "rgb(var(--c-ready) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display, var(--font-serif))", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { page: "88rem" },
    },
  },
  plugins: [],
};
export default config;
