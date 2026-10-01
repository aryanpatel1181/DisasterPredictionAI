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
          bg: '#0A0605',
          surface: '#110C0A',
          raised: '#18110E',
          border: '#2A1D18',
          'border-strong': '#3D2B23',
        },
        accent: {
          DEFAULT: '#9D3715',
          bright: '#C4501F',
          deep: '#582F24',
        },
        content: {
          primary: '#F4EDE9',
          secondary: '#A49992',
          tertiary: '#897973',
          faint: '#6F605A',
        },
        status: {
          critical: '#D4451E',
          warning: '#C98A2E',
          watch: '#9D3715',
          ok: '#5E8C61',
          info: '#7C8FA3',
        },
        // Legacy dark keys — remapped to the warm palette so existing
        // bg-dark-bg / bg-dark-card / border-dark-border usages keep working.
        dark: {
          bg: '#0A0605',
          card: '#110C0A',
          border: '#2A1D18',
          hover: '#18110E',
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
