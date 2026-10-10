/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter = body/UI/labels/numbers, Plus Jakarta Sans = headings.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        head: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
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
        // White text on the primary blue accent (buttons, active tabs, ticks).
        onaccent: '#FFFFFF',
        // Primary brand accent (royal blue) — buttons, links, active states.
        teal: '#2563EB',
        'teal-lt': '#3B82F6',
        // Professional categorical accents — all readable on light and navy.
        orange: '#DD6A1E',
        purple: '#7C5AE8',
        yellow: '#C6871B', // amber
        green: '#16A34A', // success / money / done
        pink: '#DC4A63', // rose
        blue: '#2D74D8',
        lilac: '#B45FD6',
      },
    },
  },
  plugins: [],
}
