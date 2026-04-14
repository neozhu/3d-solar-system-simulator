/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        space: {
          900: '#030508',
          800: '#0b101a',
          700: '#141c2c',
        }
      }
    },
  },
  plugins: [],
}
