/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: '#080f12',
          surface: '#0e181d',
          raised: '#142127',
          border: '#243339',
          'border-strong': '#365047',
        },
        accent: {
          DEFAULT: '#5dc9a9',
          bright: '#a3edd0',
          deep: '#215d4c',
        },
        content: {
          primary: '#edf4f0',
          secondary: '#a4b5ba',
          tertiary: '#91a0a4',
          faint: '#819095',
        },
        status: {
          critical: '#D4451E',
          warning: '#C98A2E',
          watch: '#5dc9a9',
          ok: '#5E8C61',
          info: '#7C8FA3',
        },
        // Legacy dark keys — remapped to the warm palette so existing
        // bg-dark-bg / bg-dark-card / border-dark-border usages keep working.
        dark: {
          bg: '#080f12',
          card: '#0e181d',
          border: '#243339',
          hover: '#142127',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '10px',
        full: '9999px',
      },
      fontSize: {
        micro: ['11px', { lineHeight: '14px', letterSpacing: '0.12em' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        '4xl': ['40px', { lineHeight: '46px', letterSpacing: '-0.026em' }],
        '5xl': ['56px', { lineHeight: '60px', letterSpacing: '-0.032em' }],
        '6xl': ['clamp(44px, 6.5vw, 88px)', { lineHeight: '0.98', letterSpacing: '-0.036em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
        raised: '0 4px 16px rgba(0,0,0,0.45)',
        accent: '0 0 0 1px rgba(157,55,21,0.4)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
