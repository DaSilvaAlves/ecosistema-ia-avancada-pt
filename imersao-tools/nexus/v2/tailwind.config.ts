import type { Config } from 'tailwindcss';

/**
 * Nexus v2 — Tailwind 4 configuration
 *
 * Design system [IA]AVANÇADA PT — fundo SEMPRE escuro (#04040A).
 * Apenas as 9 cores do sistema são permitidas.
 * Fontes: Inter (UI/body) + JetBrains Mono (números técnicos, badges, código).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: '#04040A',
        white: '#F0F4FF',

        // Acentos do sistema (paleta inegociável)
        cyan: '#00F5FF',
        gold: '#FFB800',
        purple: '#9D00FF',
        magenta: '#FF006E',
        lime: '#39FF14',

        // Greys
        grey: '#8892A4',
        grey2: '#4A5568',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
      backdropBlur: {
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
