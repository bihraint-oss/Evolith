import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 22px 55px rgba(19, 34, 56, 0.14)",
      },
      colors: {
        clay: {
          100: "#f5e4d3",
          200: "#e6c4a4",
          500: "#c97b57",
        },
        ink: {
          50: "#eef3f7",
          700: "#26415d",
          950: "#132238",
        },
        sand: {
          50: "#fbf6ef",
          100: "#f2e7d8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
