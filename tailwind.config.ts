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
        banda: {
          bg: '#F7F3EE',
          surface: '#FFFFFF',
          card: '#FAF7F2',
          border: '#E8E1D7',
          dark: '#141414',
          muted: '#8A8275',
          accent: '#B89368',
          hover: '#EFE8DE',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'system-ui', 'sans-serif'],
        arabic: ['"Cairo"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
