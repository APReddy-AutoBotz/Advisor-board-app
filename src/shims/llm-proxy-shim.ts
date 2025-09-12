/**
 * llm-proxy-shim: reroute any OpenAI browser call to our Netlify function
 * This runs before the rest of the app and monkey-patches window.fetch.
 */
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ENDPOINT = (import.meta as any).env?.VITE_LLM_ENDPOINT || '/.netlify/functions/llm';
if (typeof window !== 'undefined' && ENDPOINT) {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (typeof url === 'string' && url.startsWith(OPENAI_URL)) {
        // Always reroute to serverless proxy
        const body = init?.body;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        // Strip client Authorization: server function uses server-side OPENAI_API_KEY
        return origFetch(ENDPOINT, { method: 'POST', headers, body });
      }
      return origFetch(input, init);
    } catch (e) {
      return origFetch(input, init);
    }
  };
}