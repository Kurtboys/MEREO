import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        void: "#0A0A0A",
        surface: {
          DEFAULT: "#141414",
          hover: "#1A1A1A",
        },

        // Borders
        "border-subtle": "#2A2A2A",
        "border-focus": "#3B82F6",

        // Text
        "text-primary": "#E5E5E5",
        "text-secondary": "#737373",
        "text-disabled": "#525252",

        // Accent
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },

        // Status
        status: {
          warning: "#F59E0B",
          success: "#10B981",
          bottleneck: "#EF4444",
        },

        // Sticky Note Colors (muted/dark versions)
        sticky: {
          yellow: "#78716C",
          pink: "#9D7A8C",
          blue: "#64748B",
          green: "#5F7A6A",
          purple: "#7C6F93",
        },

        // Edge/Arrow Colors
        edge: {
          DEFAULT: "#3A3A3A",
          active: "#3B82F6",
          complete: "#10B981",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
      },
      transitionDuration: {
        DEFAULT: "200ms",
        "250": "250ms",
        "300": "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-out-smooth": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
