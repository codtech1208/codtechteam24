/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF5EE',
          100: '#FFE6D5',
          200: '#FFC7A8',
          300: '#FFA075',
          400: '#FF7B3B',
          500: '#FF6B00', // Primary Theme Color
          600: '#E05500',
          700: '#B83F00',
          800: '#933304',
          900: '#772C07'
        },
        slate: {
          850: '#151F32'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif']
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(255, 107, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.07)'
      }
    },
  },
  plugins: [],
}
