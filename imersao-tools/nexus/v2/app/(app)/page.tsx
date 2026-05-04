import { ChatPanel } from '@/components/chat/ChatPanel';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { OnboardingModal } from '@/components/chat/OnboardingModal';
import { SidebarWidgets } from '@/components/widgets/SidebarWidgets';

/**
 * Nexus v2 — Chat principal (Story 0.4 + 0.7 + 0.8)
 *
 * Layout chat-first: Header (56px) + ChatPanel (flex 1) + Sidebar (360px direita).
 * Story 0.7: OnboardingModal sobrepõe no primeiro carregamento.
 * Story 0.8: Sidebar populada com widgets (Markets topo per UX-4).
 *
 * Conforme UX-1 (chat permanentemente visível) e wireframe §3.1.
 */
export default function HomePage(): React.ReactElement {
  return (
    <>
      <Header />
      <main
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 'calc(100vh - 56px)',
          paddingRight: 360,
        }}
        className="nexus-main"
      >
        <ChatPanel />
        <Sidebar>
          <SidebarWidgets />
        </Sidebar>
      </main>
      <OnboardingModal />
      <style>{`
        @media (max-width: 1279px) { .nexus-main { padding-right: 320px; } }
        @media (max-width: 1023px) { .nexus-main { padding-right: 0; } }
      `}</style>
    </>
  );
}
