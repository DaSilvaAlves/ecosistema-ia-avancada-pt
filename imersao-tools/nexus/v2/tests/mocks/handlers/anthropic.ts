import { http, HttpResponse } from 'msw';

/**
 * Nexus v2 — MSW handlers Anthropic
 *
 * Snippet exacto de architecture-v2.md §5.2 — mock multi-intent canónico.
 * Reconhece o prompt fixo `paguei €78,70 supermercado, amanhã reunião 15h, lembra-me sexta luz`
 * e devolve resposta com 2 tool_use (criar_finança_variavel + criar_evento_calendar).
 *
 * Usado em testes Vitest do proxy (Story 0.5) e em testes do cérebro (Epic 1).
 */

interface AnthropicRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  stream?: boolean;
  max_tokens?: number;
}

export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = (await request.json()) as AnthropicRequestBody;
    const userMsg = body.messages.find((m) => m.role === 'user')?.content ?? '';

    // Multi-intent canónico (PRD AC1)
    if (userMsg.includes('paguei €78,70') && userMsg.includes('amanhã reunião 15h')) {
      return HttpResponse.json({
        id: 'msg_test_multi',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'criar_finança_variavel',
            input: { valor: 78.7, descricao: 'supermercado', categoria: 'Mercearia' },
          },
          {
            type: 'tool_use',
            id: 'toolu_2',
            name: 'criar_evento_calendar',
            input: { titulo: 'reunião', data: 'tomorrow', hora: '15:00' },
          },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 100, output_tokens: 50 },
      });
    }

    // Fallback genérico — resposta texto simples
    return HttpResponse.json({
      id: 'msg_test_fallback',
      type: 'message',
      role: 'assistant',
      model: body.model,
      content: [{ type: 'text', text: 'Mock response (no canonical match).' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  }),
];
