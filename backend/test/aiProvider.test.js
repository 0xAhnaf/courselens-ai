const assert = require("node:assert/strict");
const test = require("node:test");
const axios = require("axios");

test("falls back from rejected JSON mode and parses fenced JSON", async () => {
  const originalPost = axios.post;
  const payloads = [];

  axios.post = async (url, payload) => {
    payloads.push(payload);

    if (payloads.length === 1) {
      const error = new Error("Failed to validate JSON");
      error.response = {
        status: 400,
        data: { error: { message: "Failed to validate JSON. See failed_generation for details." } }
      };
      throw error;
    }

    return {
      data: {
        choices: [{ message: { content: "```json\n{\"ok\":true}\n```" } }]
      }
    };
  };

  process.env.AI_PROVIDER = "groq";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "openai/gpt-oss-20b";

  delete require.cache[require.resolve("../src/services/ai/aiProvider")];
  const { generateCompletion } = require("../src/services/ai/aiProvider");

  try {
    const result = await generateCompletion("Return JSON");
    assert.deepEqual(result, { ok: true });
    assert.equal(payloads.length, 2);
    assert.deepEqual(payloads[0].response_format, { type: "json_object" });
    assert.equal(payloads[0].include_reasoning, false);
    assert.equal(payloads[0].reasoning_effort, 'low');
    assert.equal(payloads[0].max_completion_tokens, 2500);
    assert.equal(payloads[1].response_format, undefined);
    assert.equal(payloads[1].temperature, 0);
  } finally {
    axios.post = originalPost;
  }
});

test("repairs a successful response containing invalid JSON", async () => {
  const originalPost = axios.post;
  const payloads = [];

  axios.post = async (url, payload) => {
    payloads.push(payload);
    const content = payloads.length === 1
      ? "{not valid JSON}"
      : '{"overall_score":80}';

    return { data: { choices: [{ message: { content } }] } };
  };

  process.env.AI_PROVIDER = "groq";
  process.env.AI_API_KEY = "test-key";

  delete require.cache[require.resolve("../src/services/ai/aiProvider")];
  const { generateCompletion } = require("../src/services/ai/aiProvider");

  try {
    const result = await generateCompletion("Return an assessment object");
    assert.deepEqual(result, { overall_score: 80 });
    assert.equal(payloads.length, 2);
    assert.match(payloads[1].messages[0].content, /Repair/);
    assert.equal(payloads[1].messages[1].content, "{not valid JSON}");
  } finally {
    axios.post = originalPost;
  }
});

test("honours a provider retry hint after rate limiting", async () => {
  const originalPost = axios.post;
  let calls = 0;
  axios.post = async () => {
    calls += 1;
    if (calls === 1) {
      const error = new Error('rate limited');
      error.response = { status: 429, data: { error: { message: 'Rate limit reached. Please try again in 0.01s.' } } };
      throw error;
    }
    return { data: { choices: [{ message: { content: '{"ok":true}' } }] } };
  };
  process.env.AI_PROVIDER = 'groq';
  process.env.AI_API_KEY = 'test-key';
  delete require.cache[require.resolve('../src/services/ai/aiProvider')];
  try {
    assert.deepEqual(await require('../src/services/ai/aiProvider').generateCompletion('Return JSON'), { ok: true });
    assert.equal(calls, 2);
  } finally { axios.post = originalPost; }
});
