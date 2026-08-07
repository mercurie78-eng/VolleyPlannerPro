/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          page: 'rgb(var(--theme-page) / <alpha-value>)',
          card: 'rgb(var(--theme-card) / <alpha-value>)',
          elevated: 'rgb(var(--theme-elevated) / <alpha-value>)',
          input: 'rgb(var(--theme-input) / <alpha-value>)',
          muted: 'rgb(var(--theme-muted) / <alpha-value>)',
          'muted-hover': 'rgb(var(--theme-muted-hover) / <alpha-value>)',
          border: 'rgb(var(--theme-border) / <alpha-value>)',
          heading: 'rgb(var(--theme-heading) / <alpha-value>)',
          body: 'rgb(var(--theme-body) / <alpha-value>)',
          secondary: 'rgb(var(--theme-secondary) / <alpha-value>)',
          'muted-text': 'rgb(var(--theme-muted-text) / <alpha-value>)',
          subtle: 'rgb(var(--theme-subtle) / <alpha-value>)',
          overlay: 'rgb(var(--theme-overlay) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
