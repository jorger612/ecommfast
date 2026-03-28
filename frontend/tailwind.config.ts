import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#4F46E5', hover: '#4338CA' },
        secondary: { DEFAULT: '#F59E0B', hover: '#D97706' },
        accent:    { DEFAULT: '#10B981', hover: '#059669' },
        danger:    { DEFAULT: '#EF4444', hover: '#DC2626' },
        surface:   '#F9FAFB',
        card:      '#FFFFFF',
        text:      { DEFAULT: '#111827', muted: '#6B7280' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
