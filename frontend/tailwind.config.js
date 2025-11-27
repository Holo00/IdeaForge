/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Single dark theme - no darkMode toggle needed
  theme: {
    extend: {
      colors: {
        // Background layers
        base: '#0f1419',
        surface: '#1c2128',
        elevated: '#262c36',
        hover: '#2d333b',
        'border-default': '#3d444d',
        'border-subtle': '#21262d',

        // Primary (Mint)
        mint: {
          DEFAULT: '#34D399',
          dark: '#10B981',
          light: '#6EE7B7',
        },

        // Accent (Coral - text only)
        coral: '#FF6B6B',

        // Text colors
        'text-primary': '#f0f6fc',
        'text-secondary': '#8b949e',
        'text-muted': '#6e7681',

        // Semantic colors
        success: '#34D399',
        warning: '#FBBF24',
        error: '#EF4444',
        info: '#67E8F9',
      },
      spacing: {
        '18': '4.5rem',  // 72px - sidebar collapsed
        '60': '15rem',   // 240px - sidebar expanded
      },
      fontSize: {
        'micro': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
    },
  },
  plugins: [],
}
