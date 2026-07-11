import { afterEach, describe, expect, it, vi } from 'vitest';

import { secondaryAiRepository } from './secondaryAiRepository';

describe('secondaryAiRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the selected person context to the Gemini-backed chat API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'live',
          agent_type: 'assistant',
          kind: 'writing',
          content: '本次重点核验用药与居家安全。',
          model: 'gemini-primary',
          provider: 'gemini',
          context_applied: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await secondaryAiRepository.sendMessage(
      'writing',
      '请生成走访提纲',
      'person-1',
    );

    expect(result.status).toBe('live');
    expect(result.context_applied).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      kind: 'writing',
      agent_type: 'assistant',
      message: '请生成走访提纲',
      context_id: 'person-1',
    });
  });

  it('preserves a sanitized degraded status for the visit UI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'degraded',
            agent_type: 'assistant',
            kind: 'writing',
            content: '安全降级提纲',
            model: null,
            error_code: 'AI_PROVIDER_QUOTA_EXCEEDED',
            error: 'Gemini quota is currently unavailable; a safe fallback is shown.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await secondaryAiRepository.sendMessage(
      'writing',
      '请生成走访提纲',
      'person-1',
    );

    expect(result).toMatchObject({
      status: 'degraded',
      error_code: 'AI_PROVIDER_QUOTA_EXCEEDED',
      content: '安全降级提纲',
    });
  });
});
