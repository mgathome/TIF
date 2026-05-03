import type { Config } from 'tailwindcss';

/**
 * Direction artistique TIF — palette officielle :
 *   violet #5B2EFF, jaune #FFD84D, noir #0F0F0F, blanc #F8F8F8
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/contexts/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tif: {
          violet: '#5B2EFF',
          'violet-dark': '#4524CC',
          'violet-light': '#7B54FF',
          yellow: '#FFD84D',
          'yellow-dark': '#E6BE2E',
          black: '#0F0F0F',
          white: '#F8F8F8',
          gray: {
            50: '#FAFAFA',
            100: '#F0F0F0',
            200: '#E0E0E0',
            300: '#C0C0C0',
            500: '#7A7A7A',
            700: '#3A3A3A',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        tif: '1rem',
      },
      boxShadow: {
        tif: '0 4px 16px rgba(15,15,15,0.08)',
        'tif-lg': '0 12px 32px rgba(15,15,15,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-soft': 'bounceSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
