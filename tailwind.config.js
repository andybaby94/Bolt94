/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcd4e6',
          300: '#8fb4d4',
          400: '#5a8fbd',
          500: '#3a6fa0',
          600: '#1e3a5f',
          700: '#162d4a',
          800: '#0f1f33',
          900: '#0a1526',
        },
      },
    },
  },
  plugins: [],
}
