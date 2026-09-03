/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Dark app surfaces
        ink: '#0A0E14',
        panel: '#111823',
        surface: '#0F151E',
        card: '#131A24',
        // Text
        fg: '#E8EDF3',
        soft: '#D8E1EA',
        mute: '#8798AA',
        mute2: '#5E7183',
        mute3: '#A9B7C6',
        slate: '#7C8B9E',
        // Accents
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
