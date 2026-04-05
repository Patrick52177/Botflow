/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--bg)',
        bg2:     'var(--bg2)',
        bg3:     'var(--bg3)',
        bg4:     'var(--bg4)',
        border:  'var(--border)',
        text:    'var(--text)',
        text2:   'var(--text2)',
        text3:   'var(--text3)',
        accent:  'var(--accent)',
        accent2: 'var(--accent2)',
        green:   'var(--green)',
        amber:   'var(--amber)',
        red:     'var(--red)',
        blue:    'var(--blue)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--r)',
        lg:      'var(--r2)',
      },
    },
  },
  plugins: [],
}
