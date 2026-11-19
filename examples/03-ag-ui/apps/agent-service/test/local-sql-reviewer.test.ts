import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalSqlReviewFunction } from "../src/mastra/workflows/historian-query/agents/sql-reviewer";
import { localModelConfig } from "../src/mastra/local-model";
const config = localModelConfig({});
const proposal = {
  question: "Show readings",
  sql: "SELECT * FROM historian_readings",
  explanation: "Read rows",
};
test("local reviewer uses the configured endpoint and structured output", async () => {
  const review = createLocalSqlReviewFunction(config, async (url, init) => {
    assert.equal(url, "http://127.0.0.1:8080/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "gemma-local");
    assert.equal(body.response_format.type, "json_schema");
    return Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({ approved: true, concerns: [] }),
          },
        },
      ],
    });
  });
  assert.deepEqual(await review(proposal), { approved: true, concerns: [] });
});
for (const content of [
  "not json",
  '{"approved":true}',
  '{"approved":"yes","concerns":[]}',
]) {
  test(`malformed review fails closed: ${content}`, async () => {
    const review = createLocalSqlReviewFunction(config, async () =>
      Response.json({ choices: [{ message: { content } }] }),
    );
    await assert.rejects(review(proposal));
  });
}
test("approval with concerns is rejected", async () => {
  const review = createLocalSqlReviewFunction(config, async () =>
    Response.json({
      choices: [
        {
          message: { content: '{"approved":true,"concerns":["Wrong intent"]}' },
        },
      ],
    }),
  );
  assert.equal((await review(proposal)).approved, false);
});
test("HTTP failures fail closed", async () => {
  const review = createLocalSqlReviewFunction(
    config,
    async () => new Response("", { status: 503 }),
  );
  await assert.rejects(review(proposal));
});
test("model configuration has local defaults, permits an explicit internal server and rejects URL credentials", () => {
  assert.equal(config.baseURL, "http://127.0.0.1:8080/v1");
  assert.equal(
    localModelConfig({
      LOCAL_MODEL_BASE_URL: "http://192.168.1.20:8080/v1/",
      LOCAL_MODEL_NAME: "local-qwen",
    }).model,
    "local-qwen",
  );
  assert.throws(() =>
    localModelConfig({ LOCAL_MODEL_BASE_URL: "https://user:password@host/v1" }),
  );
});
