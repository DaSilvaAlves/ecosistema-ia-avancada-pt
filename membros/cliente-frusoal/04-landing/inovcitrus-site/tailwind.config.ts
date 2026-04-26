import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ===== Núcleo (v1.0 — alinhado com Frusoal-mãe) =====
        citrus: {
          DEFAULT: '#E8A53C', // laranja citrino maduro · primário · acção
          dark: '#C68420',
          light: '#F5C570'
        },
        algarve: {
          DEFAULT: '#5A8C45', // verde algarvio sóbrio · secundário
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
        },

        // ===== Funcional (v2.0 — após audit Gomo/Biogomo) =====
        solar: '#FFD27A', // luz dourada quente · destaques · selo IGP
        pomar: '#7FB069', // verde folha viva · sucesso · activo
        tinta: '#1B2A4E', // navy científico · citações · footnotes
        critico: '#8B2E22', // bordeaux seco · alertas · Scirtothrips
        pergaminho: '#F1EBDB' // bege quente · cards Plate · destaques sóbrios
      },

      fontFamily: {
        display: [
          'Fraunces',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif'
        ],
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace'
        ]
      },

      fontSize: {
        // Display (Fraunces) — pares [size, lineHeight]
        'display-xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
        'display-l': ['3rem', { lineHeight: '1.10', letterSpacing: '-0.03em' }],
        'display-m': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'pull-quote': ['1.75rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],

        // Body (Inter)
        'body-l': ['1.125rem', { lineHeight: '1.7' }],
        'body-m': ['1rem', { lineHeight: '1.7' }],
        'body-s': ['0.875rem', { lineHeight: '1.6' }],
        caption: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],

        // Mono (JetBrains)
        'mono-tag': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.1em' }],
        'mono-footnote': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'mono-code': ['0.875rem', { lineHeight: '1.6' }]
      },

      maxWidth: {
        prose: '70ch',
        content: '1080px',
        brand: '1200px'
      },

      // ===== Tokens de motion (sóbrios · científicos) =====
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms'
      },
      transitionTimingFunction: {
        quiet: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        emphasis: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },

      // ===== Border radius (sóbrio — não tech) =====
      borderRadius: {
        plate: '4px',
        card: '6px',
        badge: '20px'
      },

      // ===== Box shadows funcionais =====
      boxShadow: {
        plate: '0 4px 12px rgba(198,132,32,0.15)',
        'plate-deep': '0 8px 24px rgba(26,26,26,0.10)',
        'solar-glow': '0 0 12px rgba(255,210,122,0.5)',
        focus: '0 0 0 3px rgba(232,165,60,0.3)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
