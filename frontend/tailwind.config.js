/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        border: '#1e1e2e',
        accent: '#6ee7b7',
        'accent-dim': '#34d399',
        muted: '#4a4a6a',
        text: '#e2e8f0',
        'text-dim': '#94a3b8',
        danger: '#f87171',
        warning: '#fbbf24',
      }
    }
  },
  plugins: []
}
