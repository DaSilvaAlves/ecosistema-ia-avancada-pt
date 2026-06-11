'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrainDumpModal } from '@/components/brain-dump/BrainDumpModal';

/**
 * Nexus v2 — BrainDumpLauncher (Story 5.6 — AC4, FR47)
 *
 * Launcher client montado em `HomePage` (à imagem do `OnboardingModal`). Abre o
 * `BrainDumpModal` ao premir "B". Não existe infra de atalhos prévia no projecto —
 * esta story introduz o handler local, guardado.
 *
 * Guarda obrigatória (`front-end-spec-v2.md#1.4 [1]`, #1066): o "B" NÃO dispara
 * quando o foco está num `<input>`, `<textarea>` ou elemento `contenteditable`
 * (senão capturava o "b" durante escrita no chat), nem com modificadores
 * (Ctrl/Meta/Alt) — para não sequestrar atalhos do browser/OS.
 *
 * `[D-5.6-SEAM]`: `onStructure` é placeholder nesta story (fecha o modal). O
 * pipeline AI (POST `/api/agent/brain-dump` + persistência) liga-se na Story 5.7.
 */

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

export function BrainDumpLauncher(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key.toLowerCase() !== 'b') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (isOpen) return;
      e.preventDefault();
      setIsOpen(true);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback((): void => setIsOpen(false), []);

  // Seam 5.7: por agora estruturar apenas fecha o modal. A Story 5.7 substitui
  // este callback pelo pipeline AI (parse + createBrainDump + transição status).
  const handleStructure = useCallback((): void => setIsOpen(false), []);

  return (
    <BrainDumpModal isOpen={isOpen} onClose={handleClose} onStructure={handleStructure} />
  );
}
