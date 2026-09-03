/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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
        // Always-dark text placed on a bright accent (buttons, chips, ticks).
        onaccent: '#0A0E14',
        // Accents — identical in both themes.
        teal: '#4ECDC4',
        'teal-lt': '#7FE3DC',
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
