/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        field: '#F3EEE6',
        shell: '#C9DCC9',
        card: '#FFFFFF',
        hero: '#F5D76E',
        lilac: '#E8D5F2',
        lift: '#C9DCC9',
        deep: '#0A0A0A',
        foam: '#FFFFFF',
        buff: '#EDE4D3',
        walnut: '#6B4E31',
        punch: '#F5D76E',
        ink: '#0A0A0A',
        rose: '#C9184A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        brutal: '4px 4px 0 0 #0A0A0A',
        'brutal-sm': '2px 2px 0 0 #0A0A0A',
        'brutal-lg': '6px 6px 0 0 #0A0A0A',
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
