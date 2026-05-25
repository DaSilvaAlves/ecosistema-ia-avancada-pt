import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DailyEngineProvider } from '@/components/system/DailyEngineProvider';

/**
 * Nexus v2 — Authenticated app layout (Story 0.4 + Story 3.10)
 *
 * Group `(app)` aplica a todas as rotas protegidas (`/`, `/tasks`, `/finance`, etc.).
 * Verificação de sessão é feita via cookie `nexus_session`. Middleware (Story 0.6)
 * já protege via redirect — esta camada serve como guard secundário no server.
 *
 * Story 3.10 / AC6 + AC12: o `<DailyEngineProvider>` envolve `{children}` dentro
 * do `<div>` (não fora — preserva `minHeight`/fundo). É um client wrapper que
 * activa o motor diário de geração de recorrências (`runRecurrenceEngine` +
 * `runFinanceRecurrenceEngine`) uma única vez por dia, no primeiro carregamento.
 * Substitui os hooks individuais `useRecurrenceEngine` / `useFinanceRecurrenceEngine`
 * que viviam nas pages `/tarefas`, `/financas` e `/financas/mes`.
 */

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('nexus_session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#04040A',
        color: '#F0F4FF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DailyEngineProvider>{children}</DailyEngineProvider>
    </div>
  );
}
