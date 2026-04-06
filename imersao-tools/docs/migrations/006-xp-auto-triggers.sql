-- ================================================================
-- MIGRATION 006: XP automático via triggers
-- Projecto: SquadMarket — [IA]AVANCADA PT
-- Data: 22/03/2026
-- Autor: Dex (Dev Agent)
--
-- Cria triggers para atribuir XP automaticamente:
--   1. +10 XP quando membro transfere squad gratuito (squad_compras com preco_pago=0)
--   2. +50 XP quando compra paga é confirmada (squad_compras com preco_pago>0)
--   3. +30 XP quando membro publica primeira review
--
-- Idempotente — seguro de executar múltiplas vezes.
-- ================================================================


-- ═══ Trigger 1: XP automático para compras (gratuitas e pagas) ═══

CREATE OR REPLACE FUNCTION public.award_compra_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para compras completed
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  IF NEW.preco_pago = 0 THEN
    -- Squad gratuito: +10 XP
    INSERT INTO public.xp_transactions (user_id, tipo, pontos, referencia_tipo, referencia_id, descricao)
    VALUES (
      NEW.user_id,
      'squad_download_free',
      10,
      'squad',
      NEW.squad_id,
      'Transferência de squad gratuito'
    )
    ON CONFLICT DO NOTHING;
  ELSE
    -- Squad pago: +50 XP
    INSERT INTO public.xp_transactions (user_id, tipo, pontos, referencia_tipo, referencia_id, descricao)
    VALUES (
      NEW.user_id,
      'squad_compra',
      50,
      'squad',
      NEW.squad_id,
      'Compra de squad'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_compra_xp() IS
  'Atribui XP automaticamente: +10 para squads gratuitos, +50 para compras pagas';

DROP TRIGGER IF EXISTS trg_award_compra_xp ON public.squad_compras;
CREATE TRIGGER trg_award_compra_xp
  AFTER INSERT ON public.squad_compras
  FOR EACH ROW
  EXECUTE FUNCTION public.award_compra_xp();


-- ═══ Trigger 2: XP automático para reviews ═══

CREATE OR REPLACE FUNCTION public.award_review_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas na primeira review (INSERT), não em UPDATE
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.xp_transactions (user_id, tipo, pontos, referencia_tipo, referencia_id, descricao)
    VALUES (
      NEW.user_id,
      'squad_review',
      30,
      'squad',
      NEW.squad_id,
      'Review publicada'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.award_review_xp() IS
  'Atribui +30 XP automaticamente quando membro publica primeira review de um squad';

DROP TRIGGER IF EXISTS trg_award_review_xp ON public.squad_reviews;
CREATE TRIGGER trg_award_review_xp
  AFTER INSERT ON public.squad_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.award_review_xp();


-- ═══ Índice para prevenir XP duplicado ═══
-- Garante que o mesmo utilizador não recebe XP duas vezes pela mesma acção no mesmo squad

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_unique_action
  ON public.xp_transactions(user_id, tipo, referencia_id)
  WHERE referencia_id IS NOT NULL;
