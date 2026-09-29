/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#08080c",
          card: "#101017",
          border: "#1c1c26",
          hover: "#1a1a24",
        },
        accent: {
          cyan: "#7c9bb5",
          purple: "#8b7cf6",
          amber: "#e8a82e",
          crimson: "#e85d55",
          emerald: "#14b876",
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.12' },
          '50%': { opacity: '0.22' },
        },
        'reveal-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'reveal-up': 'reveal-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'card-cyan': '0 18px 50px rgba(0,0,0,.12), 0 0 40px rgba(139,124,246,.04)',
        'card-amber': '0 18px 50px rgba(0,0,0,.12), 0 0 40px rgba(232,168,46,.04)',
        'card-rose': '0 18px 50px rgba(0,0,0,.12), 0 0 40px rgba(232,93,85,.04)',
        'hero-glow': '0 0 120px rgba(139,124,246,.06), 0 0 60px rgba(139,124,246,.04)',
      },
    },
  },
  plugins: [],
}
