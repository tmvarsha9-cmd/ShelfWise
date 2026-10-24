// LLM explanation helper with a non-throwing template fallback (Member 2).
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts.js";

export async function explainWithLLM(insight) {
  const fallback = {
    text: `${insight.name} has ${insight.days_of_stock ?? "unknown"} days of stock and ${insight.risk_level.toLowerCase()} risk. ${insight.recommendation}`,
    source: "fallback",
  };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 8_000,
    });
    const response = await client.messages.create({
      model: process.env.LLM_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 160,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(insight) }],
    });
    const text = response.content.find((item) => item.type === "text")?.text;
    return text ? { text, source: "llm" } : fallback;
  } catch {
    return fallback;
  }
}
