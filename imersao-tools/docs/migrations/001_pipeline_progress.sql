-- ============================================================================
-- Migration: 001_pipeline_progress
-- Description: Tabela para rastrear o progresso do aluno no pipeline pedagogico
--              da Imersao IA Portugal (6 etapas)
-- Author: Dara (Data Engineer)
-- Date: 2026-03-20
-- ============================================================================
-- Rollback: DROP TABLE IF EXISTS public.pipeline_progress;
-- ============================================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS public.pipeline_progress (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email       text            NOT NULL,
    student_name        text,

    -- Passo actual do pipeline (1-6)
    current_step        integer         NOT NULL DEFAULT 1
                                        CHECK (current_step BETWEEN 1 AND 6),

    -- Flags de conclusao por etapa
    step_1_completed    boolean         NOT NULL DEFAULT false,   -- Student Profiler
    step_2_completed    boolean         NOT NULL DEFAULT false,   -- Briefing Generator
    step_3_completed    boolean         NOT NULL DEFAULT false,   -- Starter Builder
    step_4_completed    boolean         NOT NULL DEFAULT false,   -- Prompt Optimizer
    step_5_completed    boolean         NOT NULL DEFAULT false,   -- AIOS Compiler
    step_6_completed    boolean         NOT NULL DEFAULT false,   -- Deploy Vercel

    -- Snapshots de dados de cada etapa (JSONB para flexibilidade)
    profile_data        jsonb,                                    -- ProfileData do Student Profiler
    briefing_data       jsonb,                                    -- BriefingOutput do Briefing Generator
    design_tokens       jsonb,                                    -- DesignTokens do Starter Builder

    -- Outputs finais
    project_url         text,                                     -- URL do projecto no Vercel
    github_repo         text,                                     -- URL do repo GitHub

    -- Timestamps
    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now(),

    -- Garante um registo unico por aluno
    CONSTRAINT uq_pipeline_progress_email UNIQUE (student_email)
);

-- 2. COMMENT
COMMENT ON TABLE public.pipeline_progress IS
    'Rastreia o progresso de cada aluno nas 6 etapas do pipeline pedagogico da Imersao IA Portugal';

-- 3. INDEX para lookups rapidos por email
CREATE INDEX IF NOT EXISTS idx_pipeline_progress_email
    ON public.pipeline_progress (student_email);

-- 4. TRIGGER para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_pipeline_progress_updated_at
    BEFORE UPDATE ON public.pipeline_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. RLS — Habilitar Row Level Security
ALTER TABLE public.pipeline_progress ENABLE ROW LEVEL SECURITY;

-- 5a. Policy: INSERT anonimo (o pipeline nao tem auth)
CREATE POLICY "anon_insert_pipeline_progress"
    ON public.pipeline_progress
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 5b. Policy: SELECT por email match (via header ou parametro)
--     Como nao ha auth, permitimos leitura anonima filtrada por email.
--     A aplicacao deve passar o email como filtro na query.
CREATE POLICY "anon_select_pipeline_progress"
    ON public.pipeline_progress
    FOR SELECT
    TO anon
    USING (true);

-- 5c. Policy: UPDATE por email match
--     Permite actualizar apenas o proprio registo (email deve corresponder).
--     Como nao ha auth, confiamos no filtro da aplicacao.
CREATE POLICY "anon_update_pipeline_progress"
    ON public.pipeline_progress
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- ROLLBACK PLAN (executar manualmente se necessario reverter):
-- ============================================================================
-- DROP TRIGGER IF EXISTS set_pipeline_progress_updated_at ON public.pipeline_progress;
-- DROP POLICY IF EXISTS "anon_insert_pipeline_progress" ON public.pipeline_progress;
-- DROP POLICY IF EXISTS "anon_select_pipeline_progress" ON public.pipeline_progress;
-- DROP POLICY IF EXISTS "anon_update_pipeline_progress" ON public.pipeline_progress;
-- DROP TABLE IF EXISTS public.pipeline_progress;
-- NOTE: handle_updated_at() NAO e eliminada pois pode ser usada por outras tabelas.
-- ============================================================================
