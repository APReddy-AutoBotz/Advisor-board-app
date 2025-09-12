import type { Handler } from '@netlify/functions';
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: cors, body: "Missing OPENAI_API_KEY" };
  let body: any = {};
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: cors, body: "Invalid JSON body" }; }
  const { messages = [], model = "gpt-4o-mini", temperature = 0.4, max_tokens = 600 } = body;
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature, max_tokens })
  });
  const text = await resp.text();
  return { statusCode: resp.status, headers: { ...cors, "Content-Type": "application/json" }, body: text };
};