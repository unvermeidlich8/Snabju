import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#f6f5f2',
        ink: '#1a1a1a',
        ink2: '#3c3833',
        muted: '#7a756d',
        faint: '#a8a39a',
        divider: '#e7e3da',
        accent: {
          DEFAULT: '#ff6a13',
          dk: '#e85d0a',
          soft: '#ffe6d4',
        },
        success: {
          DEFAULT: '#2d7a4a',
          soft: '#dcefe2',
        },
        warning: '#b48a00',
        danger: '#c23a2a',
      },
      fontFamily: {
        sans: ['var(--font-onest)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jbmono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;