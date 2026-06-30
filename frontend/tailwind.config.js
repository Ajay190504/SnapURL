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
          bg: '#090D1A',
          card: 'rgba(22, 29, 48, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
          textMuted: '#94A3B8',
          textActive: '#F8FAFC',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          teal: '#0D9488',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px rgba(59, 130, 246, 0.15)',
        'glow-purple': '0 0 25px rgba(139, 92, 246, 0.15)',
      }
    },
  },
  plugins: [],
}
