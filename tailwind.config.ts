import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1E3A5F', light: '#2A4A6F', dark: '#152B47' },
        gold: { DEFAULT: '#D4A843', light: '#E8C97A' },
      },
    },
  },
  plugins: [],
} satisfies Config;
