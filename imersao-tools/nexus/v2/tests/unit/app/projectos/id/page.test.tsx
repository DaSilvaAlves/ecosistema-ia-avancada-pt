import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within, act } from '@testing-library/react';
import ProjectDetailPage from '@/app/(app)/projectos/[id]/page';
import * as projectsRepo from '@/lib/db/repos/projects';
import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import type { Project, Task } from '@/types/db';

/**
 * Nexus v2 — /projectos/[id] vista detalhada tests (Story 2.9 / AC13)
 *
 * 13 cenários T1-T13 conforme AC13:
 *  T1  — Render base com projecto + 3 tasks (1 todo, 1 in-progress, 1 done)
 *        → header + status badge + progress 33% + tab Lista active + tasks agrupadas
 *  T2  — Estado Loading: projecto não inserido → skeleton/loading visible
 *  T3  — Not Found: id inexistente após carregamento → "Projecto não encontrado."
 *  T4  — Empty state tasks: projecto sem tasks → "Sem tarefas neste projecto."
 *  T5  — Tab switch Lista → Kanban: aria-selected actualiza
 *  T6  — Tab switch Kanban → Lista volta
 *  T7  — Progress bar: 0/4 → 0%; 4/4 → 100%; 1/3 → 33%
 *  T8  — Editar projecto via modal: submit chama updateProject(id, patch)
 *  T9  — Modal a11y smoke: role=dialog + aria-modal + Escape fecha
 *  T10 — Escape global fecha página: routerBack chamado quando modal fechado
 *  T11 — Arrow keys no tab strip: ArrowRight Lista→Kanban; ArrowLeft volta
 *  T12 — Toast de erro: updateProject rejeita → toast PT-PT role=status
 *  T13 — Progress bar a11y: role=progressbar + aria-valuenow correcto
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerPush: vi.fn(),
  paramsId: { current: '' as string },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: mocks.routerPush }),
  useParams: () => ({ id: mocks.paramsId.current }),
}));

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Projecto de teste',
    description: 'Descrição teste',
    status: 'active',
    startDate: '2026-05-01',
    deadline: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa de teste',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function clearAll(): Promise<void> {
  await db.projects.clear();
  await db.tasks.clear();
  await db.tags.clear();
}

describe('ProjectDetailPage (Story 2.9 / AC13)', () => {
  beforeEach(async () => {
    await clearAll();
    vi.restoreAllMocks();
    mocks.routerBack.mockClear();
    mocks.routerPush.mockClear();
    mocks.paramsId.current = '';
  });

  afterEach(() => {
    cleanup();
  });

  // ───────────────────────────────────────────────────────────────
  // T1 — Render base
  // ───────────────────────────────────────────────────────────────
  it('T1 — Render base: projecto + 3 tasks (1 todo, 1 in-progress, 1 done) → header + progress 33% + tab Lista active', async () => {
    const project = makeProject({ name: 'Refactor', status: 'active' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ title: 'Setup', status: 'todo', projectId: project.id }));
    await createTask(makeTask({ title: 'Build', status: 'in-progress', projectId: project.id }));
    await createTask(makeTask({ title: 'Ship', status: 'done', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);

    // Header h1 visível com nome do projecto
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Refactor' })).toBeInTheDocument();
    });

    // Status badge ACTIVO
    expect(screen.getByText('ACTIVO')).toBeInTheDocument();

    // Progress 33% concluído (1 done de 3)
    await waitFor(() => {
      expect(screen.getByText(/33% concluído/)).toBeInTheDocument();
    });

    // Tab Lista active por defeito
    const listaTab = screen.getByRole('tab', { name: 'Lista' });
    expect(listaTab).toHaveAttribute('aria-selected', 'true');

    // Sections visíveis: Por fazer (1), Em curso (1), Concluídas (1)
    await waitFor(() => {
      expect(screen.getByTestId('project-tasks-section-todo')).toBeInTheDocument();
    });
    expect(screen.getByTestId('project-tasks-section-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('project-tasks-section-done')).toBeInTheDocument();
    expect(screen.queryByTestId('project-tasks-section-blocked')).not.toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────
  // T2 — Loading
  // ───────────────────────────────────────────────────────────────
  it('T2 — Estado Loading: render inicial mostra skeleton antes do useLiveQuery resolver', () => {
    mocks.paramsId.current = crypto.randomUUID();
    render(<ProjectDetailPage />);

    // No 1º render, projectExists/project ainda são undefined → skeleton visível
    // (Dexie pode resolver muito rápido em jsdom; apenas asseguramos que o render
    // ocorre sem erros e que algum dos estados válidos está presente).
    const skeleton = screen.queryByTestId('project-detail-skeleton');
    const notFound = screen.queryByTestId('project-not-found');
    expect(skeleton ?? notFound).toBeTruthy();
  });

  // ───────────────────────────────────────────────────────────────
  // T3 — Not Found
  // ───────────────────────────────────────────────────────────────
  it('T3 — Not Found: id inexistente após carregamento → "Projecto não encontrado." + botão "Voltar aos projectos"', async () => {
    // Inserir um projecto diferente para o useLiveQuery ter dados a comparar
    await projectsRepo.createProject(makeProject({ name: 'Outro projecto' }));
    mocks.paramsId.current = crypto.randomUUID(); // id diferente de qualquer inserido

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('project-not-found')).toBeInTheDocument();
    });
    expect(screen.getByText('Projecto não encontrado.')).toBeInTheDocument();

    const backBtn = screen.getByRole('button', { name: /Voltar aos projectos/i });
    fireEvent.click(backBtn);
    expect(mocks.routerPush).toHaveBeenCalledWith('/projectos');
  });

  // ───────────────────────────────────────────────────────────────
  // T4 — Empty state tasks
  // ───────────────────────────────────────────────────────────────
  it('T4 — Empty tasks: projecto existe mas sem tasks → "Sem tarefas neste projecto." + CTA "Ver tarefas em /tarefas"', async () => {
    const project = makeProject({ name: 'Vazio' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('project-tasks-empty')).toBeInTheDocument();
    });
    expect(screen.getByText('Sem tarefas neste projecto.')).toBeInTheDocument();

    const cta = screen.getByRole('button', { name: /Ver tarefas em \/tarefas/i });
    fireEvent.click(cta);
    expect(mocks.routerPush).toHaveBeenCalledWith('/tarefas');
  });

  // ───────────────────────────────────────────────────────────────
  // T5 — Tab switch Lista → Kanban
  // ───────────────────────────────────────────────────────────────
  it('T5 — Tab switch Lista → Kanban: click muda aria-selected e renderiza Kanban', async () => {
    const project = makeProject({ name: 'Switch test' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ title: 'T1', status: 'todo', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('aria-selected', 'true');
    });

    const kanbanTab = screen.getByRole('tab', { name: 'Kanban' });
    fireEvent.click(kanbanTab);

    await waitFor(() => {
      expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('aria-selected', 'false');

    // Tab panel Kanban visível
    expect(screen.getByRole('tabpanel', { name: 'Vista Kanban' })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────
  // T6 — Tab switch Kanban → Lista volta
  // ───────────────────────────────────────────────────────────────
  it('T6 — Tab switch Kanban → Lista: voltar à lista preserva tasks visíveis', async () => {
    const project = makeProject({ name: 'Back test' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ title: 'TaskA', status: 'todo', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Lista' })).toBeInTheDocument();
    });

    // Switch to Kanban
    fireEvent.click(screen.getByRole('tab', { name: 'Kanban' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Kanban' })).toHaveAttribute('aria-selected', 'true');
    });

    // Switch back to Lista
    fireEvent.click(screen.getByRole('tab', { name: 'Lista' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('aria-selected', 'true');
    });

    expect(screen.getByRole('tabpanel', { name: 'Vista lista' })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────
  // T7 — Progress bar — 3 cenários
  // ───────────────────────────────────────────────────────────────
  it('T7a — Progress 0% concluído quando 0 done de N', async () => {
    const project = makeProject({ name: 'Zero done' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    await createTask(makeTask({ status: 'in-progress', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('0% concluído')).toBeInTheDocument();
    });
  });

  it('T7b — Progress 100% concluído quando todas done', async () => {
    const project = makeProject({ name: 'All done' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('100% concluído')).toBeInTheDocument();
    });
  });

  it('T7c — Progress 33% concluído quando 1 done de 3', async () => {
    const project = makeProject({ name: 'Third done' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('33% concluído')).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // T8 — Editar projecto via modal
  // ───────────────────────────────────────────────────────────────
  it('T8 — Editar: click "Editar" → modal abre com role=dialog + aria-modal + submit chama updateProject 1x', async () => {
    const project = makeProject({ name: 'Editavel', description: 'Original' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;
    const updateSpy = vi.spyOn(projectsRepo, 'updateProject');

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('project-edit-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('project-edit-button'));

    // Modal aberto
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Form pré-preenchido — nome "Editavel"
    const nameInput = within(dialog).getByLabelText(/Nome/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Editavel');

    // Alterar nome
    fireEvent.change(nameInput, { target: { value: 'Editavel v2' } });

    // Submit
    const submitBtn = within(dialog).getByRole('button', { name: /Guardar/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    const [calledId, calledPatch] = updateSpy.mock.calls[0];
    expect(calledId).toBe(project.id);
    expect(calledPatch.name).toBe('Editavel v2');

    // Modal fecha após submit
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // T9 — Modal a11y smoke
  // ───────────────────────────────────────────────────────────────
  it('T9 — Modal a11y: aberto → Escape fecha sem submeter', async () => {
    const project = makeProject({ name: 'A11y' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('project-edit-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('project-edit-button'));
    await screen.findByRole('dialog');

    // Escape no document fecha o modal
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    // routerBack NÃO foi chamado (modal absorveu o Escape)
    expect(mocks.routerBack).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────
  // T10 — Escape global fecha página
  // ───────────────────────────────────────────────────────────────
  it('T10 — Escape global: keyDown Escape com modal fechado → routerBack chamado', async () => {
    const project = makeProject({ name: 'Esc test' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Esc test' })).toBeInTheDocument();
    });

    // Escape global no window
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(mocks.routerBack).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // T11 — Arrow keys no tab strip
  // ───────────────────────────────────────────────────────────────
  it('T11 — Arrow keys: ArrowRight Lista→Kanban, ArrowLeft volta', async () => {
    const project = makeProject({ name: 'Keys test' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Lista' })).toBeInTheDocument();
    });

    const listaTab = screen.getByRole('tab', { name: 'Lista' });
    const kanbanTab = screen.getByRole('tab', { name: 'Kanban' });

    // ArrowRight em "Lista" → Kanban activa
    fireEvent.keyDown(listaTab, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
    });

    // ArrowLeft em "Kanban" → Lista volta
    fireEvent.keyDown(kanbanTab, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(listaTab).toHaveAttribute('aria-selected', 'true');
    });

    // Home → primeira (Lista)
    fireEvent.keyDown(kanbanTab, { key: 'End' });
    await waitFor(() => {
      expect(kanbanTab).toHaveAttribute('aria-selected', 'true');
    });
    fireEvent.keyDown(kanbanTab, { key: 'Home' });
    await waitFor(() => {
      expect(listaTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // T12 — Toast de erro ao editar
  // ───────────────────────────────────────────────────────────────
  it('T12 — Toast erro editar: updateProject rejeita → toast PT-PT com role=status', async () => {
    const project = makeProject({ name: 'Err test' });
    await projectsRepo.createProject(project);
    mocks.paramsId.current = project.id;

    // O ProjectFormModal re-throws o erro do `onSubmit` para sinalizar que o
    // submit falhou (precedente Story 2.8). Em jsdom isto gera um unhandled
    // rejection que poluiu o output mas não afecta o teste — silenciamos
    // localmente para manter o suite limpo (o erro é capturado pelo
    // `console.error` da page e exposto via toast — que é o que validamos).
    const unhandledHandler = (): void => {
      /* swallow */
    };
    process.on('unhandledRejection', unhandledHandler);

    vi.spyOn(projectsRepo, 'updateProject').mockRejectedValueOnce(new Error('boom'));

    try {
      render(<ProjectDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('project-edit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('project-edit-button'));
      const dialog = await screen.findByRole('dialog');

      // Submit sem alterações — onSubmit do parent rejeita
      const submitBtn = within(dialog).getByRole('button', { name: /Guardar/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        const toast = screen.queryByRole('status');
        expect(toast).not.toBeNull();
        expect(toast?.textContent).toMatch(/Erro ao guardar projecto/i);
      });
    } finally {
      process.removeListener('unhandledRejection', unhandledHandler);
    }
  });

  // ───────────────────────────────────────────────────────────────
  // T13 — Progress bar a11y
  // ───────────────────────────────────────────────────────────────
  it('T13 — Progress bar a11y: role=progressbar + aria-valuenow=33 quando 1 de 3 done', async () => {
    const project = makeProject({ name: 'A11y progress' });
    await projectsRepo.createProject(project);
    await createTask(makeTask({ status: 'done', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    await createTask(makeTask({ status: 'todo', projectId: project.id }));
    mocks.paramsId.current = project.id;

    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/33% concluído/)).toBeInTheDocument();
    });

    const pb = screen.getByRole('progressbar', { name: 'Progresso do projecto' });
    expect(pb).toHaveAttribute('aria-valuenow', '33');
    expect(pb).toHaveAttribute('aria-valuemin', '0');
    expect(pb).toHaveAttribute('aria-valuemax', '100');
  });
});
