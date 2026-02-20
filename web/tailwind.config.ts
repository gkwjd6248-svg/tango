import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tango primary: deep reds
        primary: {
          50:  '#fff0f0',
          100: '#ffd6d6',
          200: '#ffadad',
          300: '#ff7f7f',
          400: '#ff4f4f',
          500: '#C41E3A', // crimson
          600: '#A0001C', // dark red
          700: '#8B0000', // deep red (main brand)
          800: '#6B0000',
          900: '#4A0000',
          950: '#2A0000',
        },
        // Accent: warm gold
        accent: {
          300: '#F0C040',
          400: '#DAA520', // goldenrod
          500: '#D4A017', // main gold
          600: '#B8860B', // dark goldenrod
          700: '#996515',
        },
        // Neutral warm grays
        warm: {
          50:  '#FFF8E7', // warm cream
          100: '#F5EDD4',
          200: '#E8D9B5',
          300: '#D4C090',
          400: '#B8A070',
          500: '#9C8050',
          600: '#7D6538',
          700: '#5E4C28',
          800: '#3F3318',
          900: '#201A0C',
          950: '#1A1A1A', // near black
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
