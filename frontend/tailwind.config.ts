import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
          light: "#A5B4FC",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        slate: {
          950: "#020617",
        },
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(79, 70, 229, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
