import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        "bg-secondary": "#FFFFFF",
        surface: "#FFFFFF",
        "surface-alt": "#F1F5F9",
        border: {
          DEFAULT: "#E2E8F0",
          bright: "#CBD5E1",
          blue: "#BFDBFE",
        },
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#FEF9C3",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },
        text: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          muted: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      boxShadow: {
        "lab-card": "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        "lab-hover": "0 20px 40px -15px rgba(37, 99, 235, 0.12), 0 0 20px 0 rgba(15, 23, 42, 0.04)",
        "lab-pill": "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
