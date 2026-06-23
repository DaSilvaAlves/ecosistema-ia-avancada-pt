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

const ServerEnvObject = z.object({
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

  // Story 4.8 — segredo partilhado que protege `/api/push/dispatch` (chamado
  // pelo scheduler, sem cookie de sessão). Opcional em dev (o dispatch recusa-se
  // a operar se ausente); provisionado pelo @devops em prod. NUNCA logado (NFR5).
  CRON_SECRET: z.string().optional(),

  // Story 6.16 [D-6.16-BRIEFING-SCHEDULE] — janela horária do briefing matinal
  // (hora local de Lisboa, `[start, end[`). Config estática (não estado) → env,
  // não KV (evita leitura KV no caminho quente). Default 7/9 quando ausentes.
  // `z.coerce.number()`: as env vars chegam sempre como string; coerce converte.
  BRIEFING_HOUR_START: z.coerce.number().int().min(0).max(23).optional(),
  BRIEFING_HOUR_END: z.coerce.number().int().min(0).max(24).optional(),

  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

// Story 6.16 [D-6.16-BRIEFING-SCHEDULE] — quando ambas as horas estão definidas,
// `start` tem de ser estritamente menor que `end`. Caso contrário a janela
// `[start, end[` é vazia e o briefing devolve `outside_window` em TODAS as
// execuções, silenciosamente. Validar aqui falha no arranque (não em runtime).
const ServerEnvSchema = ServerEnvObject.refine(
  (env) =>
    env.BRIEFING_HOUR_START === undefined ||
    env.BRIEFING_HOUR_END === undefined ||
    env.BRIEFING_HOUR_START < env.BRIEFING_HOUR_END,
  {
    message:
      'BRIEFING_HOUR_START tem de ser menor que BRIEFING_HOUR_END (janela [start, end[ vazia caso contrário)',
    path: ['BRIEFING_HOUR_START'],
  },
);

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
    // Test mode: tolera ausências, retorna parsed-best-effort.
    // `.partial()` é do `ZodObject` base (o `.refine()` produz `ZodEffects`,
    // que não expõe `.partial()`); o refine start<end não é crítico em test.
    const result = ServerEnvObject.partial().safeParse(process.env);
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
