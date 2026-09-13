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
        neuro: {
          950: '#07090e',
          900: '#0c1017',
          850: '#111722',
          800: '#172030',
          700: '#233047',
          600: '#334460',
          500: '#4a6085',
          accent1: '#38bdf8', // f1 - Sky Blue
          accent2: '#34d399', // f2 - Emerald
          accent3: '#a78bfa', // f3 - Violet
          accent4: '#f472b6', // f4 - Pink/Rose
          target: '#fbbf24',  // fT - Amber Tinnitus pitch
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.2), inset 0 0 5px rgba(56, 189, 248, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.6), inset 0 0 10px rgba(56, 189, 248, 0.3)' },
        }
      }
    },
  },
  plugins: [],
}
