import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Nexus v2 — Authenticated app layout (Story 0.4)
 *
 * Group `(app)` aplica a todas as rotas protegidas (`/`, `/tasks`, `/finance`, etc.).
 * Verificação de sessão é feita via cookie `nexus_session`. Middleware (Story 0.6)
 * já protege via redirect — esta camada serve como guard secundário no server.
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
      {children}
    </div>
  );
}
