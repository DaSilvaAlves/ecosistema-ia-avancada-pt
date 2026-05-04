import { z } from 'zod';

/**
 * Nexus v2 — Validação de env vars (Zod)
 *
 * Conforme architecture-v2.md §9.2.
 * Lança erro claro em arranque se var obrigatória ausente.
 *
 * Server-only (não importar em ficheiros client). Variáveis
 * `NEXT_PUBLIC_*` são acessíveis ao client por design Next.js.
 */

const ServerEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(10, 'ANTHROPIC_API_KEY ausente ou demasiado curta'),
  NEXUS_PASSWORD_HASH: z.string().min(10, 'NEXUS_PASSWORD_HASH ausente'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET ausente ou demasiado curta'),

  // Opcionais em dev (preenchidas em prod via Vercel UI)
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  WEB_PUSH_VAPID_PRIVATE: z.string().optional(),

  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;

let _serverEnv: ServerEnv | null = null;

/**
 * Lê e valida env vars server-side.
 * Em modo `test`, vars críticas são opcionais (mocks resolvem).
 *
 * @throws Error com lista de campos inválidos se algo falhar
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  if (process.env.NODE_ENV === 'test') {
    // Test mode: tolera ausências, retorna parsed-best-effort
    const result = ServerEnvSchema.partial().safeParse(process.env);
    _serverEnv = (result.success ? result.data : {}) as ServerEnv;
    return _serverEnv;
  }

  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Env vars inválidas:\n${issues}`);
  }
  _serverEnv = result.data;
  return _serverEnv;
}

export function getPublicEnv(): PublicEnv {
  return PublicEnvSchema.parse({
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC: process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC,
  });
}
