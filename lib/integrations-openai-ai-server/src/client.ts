import OpenAI from "openai";

let _openai: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      throw new Error(
        "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?",
      );
    }
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      throw new Error(
        "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?",
      );
    }
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_t, prop) {
    const inst = getOpenAIClient();
    const val = (inst as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(inst) : val;
  },
});
