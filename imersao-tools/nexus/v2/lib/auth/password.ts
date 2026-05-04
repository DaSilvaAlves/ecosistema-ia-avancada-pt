import bcrypt from 'bcryptjs';

/**
 * Nexus v2 — Password verification (Node runtime)
 *
 * `bcryptjs` (não bindings nativos) — funciona em Node serverless sem build extra.
 * NEXUS_PASSWORD_HASH é gerado uma vez localmente e guardado em Vercel env.
 */

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Helper de utilidade para gerar hash localmente.
 * NÃO é chamado em runtime — usa-se via `node -e "..."` no setup.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
