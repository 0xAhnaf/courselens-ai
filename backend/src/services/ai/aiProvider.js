const axios = require("axios");

exports.generateCompletion = async (prompt) => {
  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || (provider === "groq" ? "llama-3.1-70b-versatile" : "meta-llama/llama-3.1-70b-instruct");

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
      model: model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    };
  } else if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    payload = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    };
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const response = await axios.post(endpoint, payload, { headers, timeout: 60000 });
  const content = response.data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error("Failed to parse AI JSON response: " + content);
  }
};