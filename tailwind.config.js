/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#E8521A',
          dark: '#c94410',
          soft: 'rgba(232,82,26,0.12)',
        },
        surface: {
          DEFAULT: '#111111',
          1: '#161616',
          2: '#1c1c1c',
          3: '#242424',
          4: '#2e2e2e',
          5: '#3a3a3a',
        },
        text: {
          DEFAULT: '#f0ebe5',
          muted: '#6b6b6b',
          subtle: '#999999',
        },
        cat: {
          a: '#E8521A',
          b: '#f5a623',
          c: '#4fc3f7',
          d: '#81c784',
        },
        win: '#4dff91',
        lose: '#ff5c5c',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'slide-in': 'slideIn 0.35s ease forwards',
        'count-up': 'countUp 0.8s ease forwards',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(0.8)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
