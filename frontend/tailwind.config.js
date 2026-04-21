/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        oxide: {
          50:  '#F7F6F3',
          100: '#E8E6E0',
          200: '#C9C6BD',
          300: '#8A8780',
          400: '#5C5A55',
          500: '#3A3935',
          600: '#28272A',
          700: '#1C1B1D',
          800: '#131214',
          900: '#0B0B0C',
          950: '#050505',
        },
        signal: {
          // Warm amber — dispatch / emergency beacon
          50:  '#FFF6EC',
          200: '#FFD7A6',
          400: '#FFA94D',
          500: '#F08D1B',
          600: '#C5700F',
        },
        ember: '#E84C3D',  // for emergencies
        moss:  '#7A9E6F',  // for completed
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:    ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
