/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          50: '#f0f7fd',
          100: '#e0effb',
          500: '#0a66c2',
          600: '#004182',
          700: '#002a54',
        },
      },
    },
  },
  plugins: [],
}
