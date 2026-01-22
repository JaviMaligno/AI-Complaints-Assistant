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
        // Carsa brand colors (approximated from their site)
        carsa: {
          primary: "#1a1a2e",      // Dark blue/purple
          secondary: "#16213e",    // Darker blue
          accent: "#e94560",       // Red accent
          light: "#f8f9fa",        // Light background
          success: "#10b981",      // Green for positive actions
          warning: "#f59e0b",      // Amber for warnings
        },
      },
    },
  },
  plugins: [],
};
export default config;
