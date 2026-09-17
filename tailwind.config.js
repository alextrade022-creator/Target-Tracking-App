/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Satoshi = body/UI, Montserrat = labels/numbers/uppercase, Poppins = headings.
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        head: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Theme-aware neutrals — resolved from CSS variables so they flip
        // between light and dark (see :root / [data-theme] in index.css).
        ink: 'var(--bg)',
        panel: 'var(--panel)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        fg: 'var(--fg)',
        soft: 'var(--soft)',
        mute: 'var(--mute)',
        mute2: 'var(--mute2)',
        mute3: 'var(--mute3)',
        slate: 'var(--slate)',
        // Hairline borders / subtle overlays; alpha applied per-use, e.g. hair/10.
        hair: 'rgb(var(--hair-rgb) / <alpha-value>)',
        // Supporting tint — soft backgrounds, tags, hover states (theme-aware).
        tint: 'var(--tint)',
        // Text placed on the bright accent (buttons, chips, ticks) — dark green for contrast.
        onaccent: '#06231B',
        // Primary brand accent (green) — buttons, links, highlights. Same in both themes.
        teal: '#0EA572',
        'teal-lt': '#34C892',
        orange: '#FF8A3D',
        purple: '#A78BFA',
        yellow: '#F4D35E',
        green: '#7BC96F',
        pink: '#FF6B8A',
        blue: '#5FA8FF',
        lilac: '#E4A0FF',
      },
    },
  },
  plugins: [],
}
