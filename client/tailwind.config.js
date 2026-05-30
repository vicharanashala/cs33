/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        success: 'var(--success)',
        error:   'var(--error)',
      },
      fontFamily: {
        sans: ['var(--sans)'],
        heading: ['var(--heading)'],
        mono: ['var(--mono)'],
      },
    },
  },
  plugins: [],
};