/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A7F3D0', // emerald-200
          DEFAULT: '#34D399', // emerald-400
          dark: '#059669',   // emerald-600
        },
        secondary: {
          light: '#475569', // slate-600
          DEFAULT: '#1E293B', // slate-800
          dark: '#0F172A',   // slate-900
        },
        accent: {
          light: '#F472B6', // rose-400
          DEFAULT: '#EC4899', // rose-500
          dark: '#BE185D',   // rose-700
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293d',
          900: '#0f172a',
        },
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
