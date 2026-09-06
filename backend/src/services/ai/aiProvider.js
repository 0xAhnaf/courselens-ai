const axios = require("axios");

const MAX_ATTEMPTS = 3;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getProviderError = (error) =>
  error.response?.data?.error?.message ||
  error.response?.data?.message ||
  error.message ||
  "Unknown AI provider error";

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
      temperature: 0.2
    };
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers,
        timeout: 60000
      });

      const content = response.data?.choices?.[0]?.message?.content;

      if (typeof content !== "string" || !content.trim()) {
        throw new Error("AI provider returned an empty response");
      }

      return JSON.parse(content);
    } catch (error) {
      const status = error.response?.status;
      const retryable =
        !status ||
        status === 400 ||
        status === 408 ||
        status === 429 ||
        status >= 500;

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw new Error(
          `AI provider request failed: ${getProviderError(error)}`
        );
      }

      await wait(800 * attempt);
    }
  }
};