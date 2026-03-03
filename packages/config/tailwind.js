/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WeCare4You brand palette — calm, trust-inspiring
        primary: {
          50:  "#eef9f5",
          100: "#d6f2e8",
          200: "#b0e5d3",
          300: "#7dd1b8",
          400: "#4db898",
          500: "#2a9d7f",
          600: "#1e7d65",
          700: "#1a6453",
          800: "#174f43",
          900: "#154238",
        },
        accent: {
          50:  "#fdf6ee",
          100: "#fae8d1",
          200: "#f5cfa0",
          300: "#efb06c",
          400: "#e8913b",
          500: "#d97322",
          600: "#b85c18",
          700: "#934516",
          800: "#773919",
          900: "#623118",
        },
        neutral: {
          50:  "#f9fafb",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
