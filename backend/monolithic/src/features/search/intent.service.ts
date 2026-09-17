import type { InterpretationResult, SearchQueryInterpreter, UserContext } from './intent.types';
import { deterministicInterpreter } from './deterministic.interpreter';
import { LlmQueryInterpreter } from './llm.interpreter';

export class IntentService {
  private deterministic: SearchQueryInterpreter;
  private llm: LlmQueryInterpreter;

  constructor(
    deterministic: SearchQueryInterpreter = deterministicInterpreter,
    llm: LlmQueryInterpreter = new LlmQueryInterpreter()
  ) {
    this.deterministic = deterministic;
    this.llm = llm;
  }

  public setLlmInterpreter(llm: LlmQueryInterpreter): void {
    this.llm = llm;
  }

  public setDeterministicInterpreter(deterministic: SearchQueryInterpreter): void {
    this.deterministic = deterministic;
  }

  /**
   * Interprets natural language search queries into structured SearchIntent.
   * Leverages fast deterministic parser first, invokes LLM where beneficial,
   * and guarantees seamless graceful degradation if AI services fail.
   */
  public async interpret(query: string, context?: UserContext): Promise<InterpretationResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        intent: {},
        source: 'deterministic',
      };
    }

    // 1. Fast deterministic extraction (zero network latency, zero token cost)
    const fastResult = await this.deterministic.interpret(trimmed, context);

    // If deterministic parser extracted concrete filters with high confidence, use it immediately
    const hasConcreteFilters = Boolean(
      fastResult.intent.gender ||
      fastResult.intent.zodiacSign ||
      fastResult.intent.ageMin !== undefined ||
      fastResult.intent.ageMax !== undefined ||
      (fastResult.intent.interests && fastResult.intent.interests.length > 0)
    );

    if (hasConcreteFilters && (fastResult.intent.confidence ?? 0) >= 0.7) {
      return fastResult;
    }

    // 2. Attempt LLM Interpretation if configured
    if (process.env.LLM_INTERPRETER_ENDPOINT && !this.llm.isCircuitOpen()) {
      try {
        const llmResult = await this.llm.interpret(trimmed, context);
        return llmResult;
      } catch (err: any) {
        console.warn(`[IntentService] LLM interpretation failed, falling back to deterministic extraction: ${err?.message || err}`);
        return {
          intent: fastResult.intent,
          source: 'fallback',
          degraded: true,
        };
      }
    }

    // Default to deterministic result
    return fastResult;
  }
}

export const intentService = new IntentService();
