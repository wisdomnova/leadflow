import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: '#FBFBFB',
        foreground: '#101828',
        primary: '#745DF3',
        secondary: '#F5F3FF',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
};

export default config;
