/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#E07A5F',
          50: '#FCF0ED',
          100: '#F9E1DB',
          200: '#F3C3B7',
          300: '#EDA593',
          400: '#E88770',
          500: '#E07A5F',
          600: '#D95A3A',
          700: '#B74627',
          800: '#8C361E',
          900: '#612515',
        },
        secondary: {
          DEFAULT: '#3D5A80',
          50: '#EEF2F6',
          100: '#DCE4ED',
          200: '#B9C9DB',
          300: '#97AEC8',
          400: '#7493B6',
          500: '#5178A4',
          600: '#3D5A80',
          700: '#2E4360',
          800: '#1E2D40',
          900: '#0F1620',
        },
        accent: {
          DEFAULT: '#81936A',
          50: '#F2F4EF',
          100: '#E5E9DF',
          200: '#CBD3BF',
          300: '#B1BD9F',
          400: '#97A77F',
          500: '#81936A',
          600: '#677553',
          700: '#4D573E',
          800: '#333A29',
          900: '#1A1D15',
        },
        // Dark mode surface colors
        surface: {
          DEFAULT: '#1E293B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(224, 122, 95, 0.3)',
        'glow-lg': '0 0 40px rgba(224, 122, 95, 0.4)',
      },
    },
  },
  plugins: [],
}
