/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#A855F7',
        accent: '#C084FC',
        background: '#F8F5FF',
        card: '#FFFFFF',
        text: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      borderRadius: {
        card: '24px',
        button: '16px',
        input: '16px',
        nav: '30px',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(124, 58, 237, 0.08)',
        card: '0 2px 16px -2px rgba(31, 41, 55, 0.06)',
        premium: '0 8px 30px -6px rgba(124, 58, 237, 0.12)',
      },
      maxWidth: {
        app: '480px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
