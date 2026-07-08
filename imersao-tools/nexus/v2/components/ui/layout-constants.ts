/**
 * Nexus v2 — constantes de layout partilhadas (Story 9.5 fix #4)
 *
 * Fonte única do valor de altura do `Header` sticky. Vive num módulo próprio
 * (não em `Header.tsx`) para o poder importar tanto no `Header` como no
 * `OfflineBanner` sem criar import circular — o `Header` já importa o
 * `OfflineBanner`, logo o `OfflineBanner` não pode importar do `Header`.
 *
 * O `OfflineBanner` posiciona-se logo abaixo do `Header` (`top: HEADER_HEIGHT_PX`)
 * e o `Header` usa este mesmo valor como `height` — manter os dois em sincronia
 * a partir de uma única constante evita o número mágico duplicado (56).
 */
export const HEADER_HEIGHT_PX = 56;
