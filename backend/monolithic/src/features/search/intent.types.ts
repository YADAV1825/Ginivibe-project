export interface SearchIntent {
  text?: string;
  interests?: string[];
  gender?: string;
  zodiacSign?: string;
  ageMin?: number;
  ageMax?: number;
  confidence?: number;
}

export interface UserContext {
  userAge?: number;
  gender?: string;
}

export interface InterpretationResult {
  intent: SearchIntent;
  source: 'deterministic' | 'llm' | 'fallback';
  degraded?: boolean;
}

export interface SearchQueryInterpreter {
  interpret(query: string, context?: UserContext): Promise<InterpretationResult>;
}
