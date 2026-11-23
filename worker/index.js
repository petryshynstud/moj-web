// worker/index.js

const POVOLENE_ORIGINY = [
  "https://petryshynstud.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://localhost:8080"
];

function cors(origin) {
  const localhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const githubOrigin = origin.endsWith('.github.io');
  const povoleny = !origin || POVOLENE_ORIGINY.includes(origin) || localhostOrigin || githubOrigin
    ? (origin || '*')
    : POVOLENE_ORIGINY[0];
  return {
    "Access-Control-Allow-Origin": povoleny,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Metóda nie je povolená" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Neplatný JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }

    try {
      // Отримуємо системний промпт (скіли персонажа)
      const systemText = data.systemInstruction?.parts?.[0]?.text || "";

      // Перетворюємо історію з формату Gemini у формат Llama 3
      const messages = [
        { role: "system", content: systemText },
        ...data.contents.map(c => ({
          role: c.role === "model" ? "assistant" : "user", 
          content: c.parts.map(p => p.text).join("")
        }))
      ];

      const odpoved = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: messages,
        max_tokens: 1024
      });

      // Повертаємо відповідь у форматі, який очікує ваш chat.js
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{ text: odpoved.response }]
          }
        }]
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors(origin) }
      });
    }
  }
};