import { ImageResponse } from 'next/og';

/**
 * Nexus v2 — Gerador de ícones PWA em código (Story 9.4)
 *
 * Identidade "as-code": zero binários comitados. Cada tamanho de ícone é
 * servido por um route handler sob `/icons/*` (coberto por `PUBLIC_PREFIXES`
 * do `middleware.ts`, sem edição do middleware — AC7).
 *
 * Glyph: um "N" (Nexus) desenhado em SVG (dois verticais + diagonal), traçado
 * em Cyan `#00F5FF` sobre fundo `#04040A` — as duas cores exactas do
 * design-system (`design-system-ia-avancada.md`, AC4). O glyph é vectorial
 * (SVG puro), logo não depende de nenhuma fonte carregada em runtime.
 *
 * Variante `maskable`: o glyph ocupa ~56% do canvas, ficando inteiramente
 * dentro da zona-segura central (~80%) exigida pelos launchers Android, com o
 * fundo escuro a preencher toda a área para nunca haver corte visível (AC2).
 *
 * A pasta `_lib` tem prefixo `_` → o Next não a trata como rota (private folder).
 */

const BACKGROUND = '#04040A';
const CYAN = '#00F5FF';

interface NexusIconOptions {
  /** Reduz o glyph para caber na zona-segura central (~80%) dos launchers Android. */
  maskable?: boolean;
}

export function nexusIcon(size: number, options: NexusIconOptions = {}): ImageResponse {
  const { maskable = false } = options;
  // Zona-segura: no maskable o glyph ocupa 56% (fica dentro do círculo/squircle
  // de recorte); nos normais 70% para preencher melhor o tile.
  const glyphSize = Math.round(size * (maskable ? 0.56 : 0.7));

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BACKGROUND,
        }}
      >
        <svg
          width={glyphSize}
          height={glyphSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* "N": vertical esquerdo → diagonal → vertical direito. */}
          <path
            d="M18 82 L18 18 L82 82 L82 18"
            stroke={CYAN}
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
