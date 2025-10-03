/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#596175',   // Slate Blue
        secondary: '#5B9085', // Teal Green
        accent: '#529F44',    // Bright Green
        background: '#EDF0ED',// Off White
        dark: '#305A65',      // Dark Teal
      },
    },
  },
  plugins: [],
};
