import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade Frusoal InovCitrus — extraída do site frusoal.pt
        citrus: {
          DEFAULT: '#E8A53C', // laranja citrino maduro (primário)
          dark: '#C68420',
          light: '#F5C570'
        },
        algarve: {
          DEFAULT: '#5A8C45', // verde algarvio sóbrio (secundário)
          dark: '#3F6A2E',
          light: '#8AB16C'
        },
        ink: {
          DEFAULT: '#1A1A1A', // texto principal
          muted: '#3A3A3A', // texto corpo
          subtle: '#6B6B6B' // texto secundário
        },
        surface: {
          DEFAULT: '#FFFFFF',
          warm: '#FAF8F4', // off-white quente
          border: '#E5E2DA'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      maxWidth: {
        prose: '70ch',
        content: '1080px'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
