import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faf4",
          100: "#dcf3e4",
          200: "#bce6cc",
          300: "#8ed2aa",
          400: "#5bb582",
          500: "#369763",
          600: "#26794e",
          700: "#1f6140",
          800: "#1c4d35",
          900: "#18402d",
          950: "#0a2419",
        },
        accent: {
          50: "#eff8ff",
          100: "#dcefff",
          200: "#c0e3ff",
          300: "#94d1ff",
          400: "#61b6ff",
          500: "#3b98fd",
          600: "#237af2",
          700: "#1c63de",
          800: "#1e50b3",
          900: "#1e458c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 10px 0 rgba(16, 24, 40, 0.06)",
        "card-hover": "0 8px 24px 0 rgba(16, 24, 40, 0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
