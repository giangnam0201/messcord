import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          accent: '#5865f2',
          green: '#3ba55d',
          yellow: '#faa61a',
          red: '#ed4245',
          pink: '#eb459e'
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
