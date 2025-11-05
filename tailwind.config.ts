/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'oswald': ['var(--font-oswald)', 'Helvetica Neue'],
        'helvetica': ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Optional: Add custom colors if needed
      },
    },
  },
  plugins: [],
}