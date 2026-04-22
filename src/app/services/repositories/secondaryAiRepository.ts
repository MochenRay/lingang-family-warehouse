import { fetchJson } from '../api';
import { buildSecondaryAiReply, type SecondaryAiKind } from '../secondaryAiDemo';

export type SecondaryAiStatus = 'live' | 'disabled' | 'unconfigured' | 'degraded' | 'placeholder';

export interface SecondaryAiChatResult {
  status: SecondaryAiStatus;
  agent_type: 'data_agent' | 'dispatch_agent' | 'assistant';
  kind: SecondaryAiKind;
  content: string;
  summary?: string;
  model?: string | null;
  used_fallback_model?: boolean;
  error?: string | null;
}

function buildLocalFallback(kind: SecondaryAiKind, prompt: string, error?: string): SecondaryAiChatResult {
  return {
    status: 'degraded',
    agent_type: 'assistant',
    kind,
    content: buildSecondaryAiReply(kind, prompt),
    summary: 'Secondary AI API unavailable, used local fallback sample.',
    model: null,
    used_fallback_model: false,
    error: error ?? null,
  };
}

export const secondaryAiRepository = {
  async sendMessage(kind: SecondaryAiKind, prompt: string): Promise<SecondaryAiChatResult> {
    try {
      return await fetchJson<SecondaryAiChatResult>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          agent_type: 'assistant',
          message: prompt,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'secondary-ai-api-unavailable';
      console.warn('Secondary AI API unavailable, using local fallback.', error);
      return buildLocalFallback(kind, prompt, message);
    }
  },
};
