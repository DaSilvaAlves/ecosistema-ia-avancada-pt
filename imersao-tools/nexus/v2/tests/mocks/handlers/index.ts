/**
 * Nexus v2 — MSW handlers index
 *
 * Reexporta todos os handlers como array para uso em `setupServer()`.
 */
import { anthropicHandlers } from './anthropic';
import { googleHandlers } from './google';
import { telegramHandlers } from './telegram';

export const handlers = [
  ...anthropicHandlers,
  ...googleHandlers,
  ...telegramHandlers,
];
