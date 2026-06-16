import { GoogleCalendarSettings } from '@/components/settings/GoogleCalendarSettings';

/**
 * Nexus v2 — Página de definições /settings (Story 6.1, T4)
 *
 * Rota NOVA: a pasta `(app)/settings/` não existia (as 9 reais eram diario,
 * financas, habitos, knowledge, lembretes, metas, projectos, tags, tarefas). O
 * `Header` já apontava para `/settings` (ícone de definições) — esta página dá-lhe
 * destino.
 *
 * Server component: lê o query param `?error=<tipo>` (vindo do callback OAuth,
 * [D-6.1-ERROR]) e `?connected=calendar` (sucesso) e passa o tipo de erro ao
 * componente client `GoogleCalendarSettings`. O componente apresenta a mensagem
 * PT-PT + CTA de retentar; as strings de erro vivem no componente, não aqui nem no
 * handler.
 *
 * Trace: AC1, AC4; [D-6.1-ERROR]; padrão de leitura de searchParams App Router.
 */

interface SettingsPageProps {
  searchParams: Promise<{ error?: string; connected?: string }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const error = params.error ?? null;

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '2.4rem',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: '#F0F4FF',
        }}
      >
        Definições
      </h1>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#F0F4FF',
          }}
        >
          Integrações
        </h2>
        <GoogleCalendarSettings initialError={error} />
      </section>
    </main>
  );
}
