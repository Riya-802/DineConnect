/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flame:     '#D85A30',
        ember:     '#993C1D',
        cream:     '#FDF6EE',
        parchment: '#F5ECD9',
        sage:      '#5A7A5C',
        clay:      '#B07850',
        charcoal:  '#2C2416',
        'clay-light': '#D4A574',
        'cream-dark': '#EFE0C8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card:   '16px',
        button: '12px',
        input:  '8px',
      },
      boxShadow: {
        warm:    '0 4px 24px rgba(176,120,80,0.12)',
        'warm-lg': '0 8px 40px rgba(176,120,80,0.18)',
        'warm-sm': '0 2px 8px rgba(176,120,80,0.08)',
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(135deg, #FDF6EE 0%, #F5ECD9 50%, #FCECD5 100%)',
        'flame-gradient': 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)',
        'sage-gradient':  'linear-gradient(135deg, #5A7A5C 0%, #3D5C40 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-warm': 'pulseWarm 2s infinite',
        'spin-slow':  'spin 3s linear infinite',
        'bounce-soft':'bounceSoft 1s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseWarm: { '0%,100%': { boxShadow: '0 0 0 0 rgba(216,90,48,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(216,90,48,0)' } },
        bounceSoft:{ '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
    },
  },
  plugins: [],
}
