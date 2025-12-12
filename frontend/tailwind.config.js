/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        slate: {
          950: "#0f172a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "\"Segoe UI\"",
          "-apple-system",
          "BlinkMacSystemFont",
          "Arial",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "soft-radial":
          "radial-gradient(circle at top, rgba(0, 123, 255, 0.08), transparent 55%)",
      },
      maxWidth: {
        "content": "1100px",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        ticker: "ticker 22s linear infinite",
      },
    },
  },
  plugins: [],
}
