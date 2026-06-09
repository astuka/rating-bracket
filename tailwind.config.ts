import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        panel: "#181b22",
        accent: "#7c5cff",
      },
    },
  },
  plugins: [],
};

export default config;
