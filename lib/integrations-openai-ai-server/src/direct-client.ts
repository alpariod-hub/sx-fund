import OpenAI from "openai";

let _openaiDirect: OpenAI | undefined;

function getInstance(): OpenAI {
  if (!_openaiDirect) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY must be set.");
    }
    _openaiDirect = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiDirect;
}

export const openaiDirect = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const instance = getInstance();
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(instance) : val;
  },
});
