import { extractDocument } from "../extract.js";
import { extractWithGroq } from "./groq.js";

// Picks the AI provider from server configuration. AI_PROVIDER forces one; otherwise
// Claude is used when ANTHROPIC_API_KEY is set, then Groq when GROQ_API_KEY is set.
export function chooseExtractor(env = process.env) {
  const forced = (env.AI_PROVIDER || "").toLowerCase();
  if (forced === "groq" || (!forced && !env.ANTHROPIC_API_KEY && env.GROQ_API_KEY)) {
    return { name: "groq", extract: extractWithGroq };
  }
  return { name: "claude", extract: extractDocument };
}
