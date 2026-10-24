// server/src/ai/llm.js - MEMBER 2 (Gemini version)
// explainWithLLM NEVER throws: any failure returns the rule-based explanation.

import { SYSTEM_PROMPT } from './prompts.js';

// Pure-JS explanation, used whenever the API is unavailable.
export function templateExplanation(ins) {
  const parts = [];

  if (ins.days_until_stockout !== null) {
    parts.push(
      `${ins.stockout_risk} stockout risk: ${ins.name} is estimated to last about ` +
        `${ins.days_until_stockout} days, while the supplier needs ${ins.lead_time_days} days to deliver.`
    );
  }

  const rep = ins.replenishment;
  if (rep.needs_reorder) {
    const when = rep.order_within_days === 0 ? 'right away' : `within ${rep.order_within_days} days`;
    parts.push(`Consider ordering about ${rep.suggested_order_qty} units ${when}.`);
  }

  const exp = ins.expiry;
  if (exp && ['MEDIUM', 'HIGH'].includes(exp.risk_level)) {
    parts.push(
      `Estimated expiry risk: about ${exp.units_at_risk} units may stay unsold before expiry ` +
        `in ${exp.days_to_expiry} days.`
    );
  }

  if (parts.length === 0) {
    return `${ins.name}: no significant stockout or expiry risk at the current demand estimate.`;
  }
  return parts.join(' ');
}

// Only send what the model needs to explain.
function payloadForLLM(ins) {
  return {
    name: ins.name,
    current_stock: ins.current_stock,
    daily_demand: ins.daily_demand,
    lead_time_days: ins.lead_time_days,
    days_until_stockout: ins.days_until_stockout,
    stockout_risk: ins.stockout_risk,
    replenishment: ins.replenishment,
    expiry: ins.expiry,
    warnings: ins.warnings,
  };
}

// Rejects if the promise takes longer than ms (works regardless of SDK version).
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`LLM request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Returns { text, source } where source is "llm" or "fallback".
export async function explainWithLLM(ins, { timeoutMs = 10000 } = {}) {
  const fallback = () => ({ text: templateExplanation(ins), source: 'fallback' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback();

  try {
    // Imported lazily so the app and tests still work if the SDK is not installed.
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await withTimeout(
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        contents: JSON.stringify(payloadForLLM(ins)),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          maxOutputTokens: 1024, // generous: some Gemini models spend tokens on internal thinking
        },
      }),
      timeoutMs
    );

    const text = response.text?.trim();
    if (!text) return fallback();
    return { text, source: 'llm' };
  } catch (err) {
    console.warn(`[llm] unavailable, using fallback: ${err.message}`);
    return fallback();
  }
}