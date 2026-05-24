import type { CaptureResult } from '../../shared/types';
import { classifyWithAnthropic } from './classify-ai';
import { classifyStubWithLatency } from './classify-stub';

export async function classifyCapture(rawInput: string): Promise<CaptureResult> {
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      return await classifyWithAnthropic(rawInput);
    } catch (err) {
      console.error('[classify] Anthropic failed, falling back to stub:', err);
    }
  }

  return classifyStubWithLatency(rawInput);
}
