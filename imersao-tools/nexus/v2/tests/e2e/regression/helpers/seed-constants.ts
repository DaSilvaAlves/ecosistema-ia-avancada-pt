/**
 * Story 1.12 (ADR-9, Architect Gate §4.4 Decisão 1) — Constantes de seed
 * determinístico da suite E2E de regressão.
 *
 * FONTE ÚNICA DE VERDADE (DRY): estas constantes são partilhadas entre
 *   - `seed-db.ts` (`seedRegressionDb`) — escreve as entidades em Dexie, e
 *   - `mock-events.ts` (profile builders) — emite `tool_use` que REFERENCIAM
 *     estes ids/nomes (ex.: `categoriaNome: SEED_CATEGORY_PRINCIPAL`,
 *     `contaId: SEED_ACCOUNT_ID`, `id: SEED_TASK_ID`).
 *
 * Porquê seed: as tools reais do Epic 2/3 têm pré-condições duras contra o Dexie
 * (categoria/conta/cartão/tarefa existentes) — `finance.ts:257-262`,
 * `finance.ts:464-467`, `tasks.ts:244-246`. Num Dexie vazio
 * (`regression.spec.ts` arranca limpo) essas tools lançariam. O seed mínimo
 * torna-as executáveis a sério no fluxo client-side re-rotado (coração do ADR-9),
 * sem inventar tools (No-Invention).
 *
 * Os UUIDs são fixos e válidos (v4: nibble de versão `4`, variante `8`) para
 * satisfazer os `z.string().uuid()` dos argsSchema (ex.: `CriarCartaoArgs.contaId`,
 * `CompletarTarefaArgs.id`).
 */

/** Conta semeada — desbloqueia `criar_cartao` (contaId) e `consultar_balanco`. */
export const SEED_ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';

/** Cartão semeado — desbloqueia `criar_parcelada` e finance com `cartaoNome`. */
export const SEED_CARD_ID = '22222222-2222-4222-8222-222222222222';
export const SEED_CARD_NAME = 'Visa';

/** Projecto semeado — desbloqueia `vincular_tarefa_projecto` e `criar_tarefa` com projecto. */
export const SEED_PROJECT_ID = '33333333-3333-4333-8333-333333333333';

/** Tarefa semeada — desbloqueia `completar_tarefa` (R012) e `vincular_tarefa_projecto`. */
export const SEED_TASK_ID = '44444444-4444-4444-8444-444444444444';

/**
 * Categorias semeadas — desbloqueiam `criar_financa_variavel`/`recorrente`/
 * `parcelada` (resolução por `resolveCategoriaByNome`) e `consultar_categoria`.
 * A categoria principal é a que os profile builders referenciam por defeito.
 */
export const SEED_CATEGORY_PRINCIPAL = 'Alimentação';
export const SEED_CATEGORY_NAMES = [SEED_CATEGORY_PRINCIPAL, 'Transporte', 'Geral'];

/** Saldo inicial da conta semeada (cêntimos) — irrelevante para os asserts, só não-zero. */
export const SEED_ACCOUNT_BALANCE_CENTIMOS = 100_000;
