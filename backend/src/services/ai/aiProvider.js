const axios = require("axios");

const MAX_ATTEMPTS = 3;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const parseJsonContent = (content) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI provider returned an empty response");
  }

  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("AI provider returned invalid JSON");
  }
};

const getProviderError = (error) =>
  error.response?.data?.error?.message ||
  error.response?.data?.message ||
  error.message ||
  "Unknown AI provider error";

const retryDelay = (error, attempt) => {
  const headerSeconds = Number(error.response?.headers?.['retry-after']);
  const messageMatch = getProviderError(error).match(/try again in\s+([\d.]+)s/i);
  const seconds = Number.isFinite(headerSeconds) ? headerSeconds : Number(messageMatch?.[1]);
  return Number.isFinite(seconds) ? Math.min(30000, Math.ceil(seconds * 1000) + 250) : 800 * attempt;
};

exports.generateCompletion = async (prompt) => {
  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || (provider === "groq" ? "openai/gpt-oss-20b" : "meta-llama/llama-3.1-70b-instruct");

  if (!apiKey) {
    throw new Error(`API key missing for AI provider: ${provider}`);
  }

  let endpoint = "";
  let headers = { "Content-Type": "application/json" };
  let payload = {};

  if (provider === "openrouter") {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "CourseLens AI";
    payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    };
  } else if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_completion_tokens: 2500
    };
    if (model.startsWith('openai/gpt-oss-')) {
      payload.include_reasoning = false;
      payload.reasoning_effort = 'low';
    }
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  let jsonModeEnabled = true;
  let invalidContent = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const attemptPayload = {
        ...payload,
        temperature: jsonModeEnabled ? 0.2 : 0,
        messages: invalidContent
          ? [
              {
                role: "system",
                content: "Repair the supplied content into one valid JSON object. Return JSON only, with no markdown or commentary. Preserve the original fields and meaning."
              },
              { role: "user", content: invalidContent }
            ]
          : payload.messages
      };

      if (!jsonModeEnabled) delete attemptPayload.response_format;

      const response = await axios.post(endpoint, attemptPayload, {
        headers,
        timeout: 60000
      });

      const content = response.data?.choices?.[0]?.message?.content;
      try {
        return parseJsonContent(content);
      } catch (parseError) {
        invalidContent = content || "";
        jsonModeEnabled = false;
        throw parseError;
      }
    } catch (error) {
      const status = error.response?.status;
      const providerMessage = getProviderError(error);
      const jsonGenerationFailure =
        status === 400 &&
        /validate json|failed_generation|json/i.test(providerMessage);

      if (jsonGenerationFailure) {
        const failedGeneration = error.response?.data?.error?.failed_generation;
        if (typeof failedGeneration === "string") {
          try {
            return parseJsonContent(failedGeneration);
          } catch {}
        }
        jsonModeEnabled = false;
      }

      const retryable =
        !status ||
        jsonGenerationFailure ||
        status === 408 ||
        status === 429 ||
        status >= 500;

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw new Error(
          `AI provider request failed: ${providerMessage}`
        );
      }

      await wait(retryDelay(error, attempt));
    }
  }
};
