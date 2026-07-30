/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      screens: {
        desktop: '1200px',
      },
      colors: {
        brand: {
          orange: '#FF6B35',
          'orange-light': '#FFF0EB',
          'orange-soft': '#FFE4D9',
        },
        cream: '#F7F3EF',
      },
      boxShadow: {
        login: '0 20px 50px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
