/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vintage-cream': '#FAF9F6',
        'vintage-cream-light': '#FEFDFB',
        'vintage-beige': '#C49A6C',
        'vintage-beige-light': '#D4B896',
        'vintage-red': '#E14D2A',
      },
      backgroundColor: {
        'vintage-cream': '#FAF9F6',
        'vintage-cream-light': '#FEFDFB',
      }
    },
  },
  plugins: [],
};
