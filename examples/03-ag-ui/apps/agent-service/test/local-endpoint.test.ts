import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { createMainAgent } from "../src/mastra/agents/main/agent";
import {
  createSqlGenerationFunction,
  createSqlGeneratorAgent,
} from "../src/mastra/workflows/historian-query/agents/sql-generator-agent";
import { createHistorianQueryWorkflow } from "../src/mastra/workflows/historian-query/workflow";
import { createLocalSqlReviewFunction } from "../src/mastra/workflows/historian-query/agents/sql-reviewer";
test("actual Mastra model calls and local reviewer use the configured Chat Completions endpoint", async () => {
  const paths: string[] = [];
  const models: string[] = [];
  const server = createServer(async (req, res) => {
    paths.push(req.url ?? "");
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    models.push(body.model);
    const input = JSON.stringify(body.messages);
    const content = input.includes("Review a proposed SQLite query")
      ? JSON.stringify({ approved: true, concerns: [] })
      : input.includes("Generate one read-only SQLite")
        ? JSON.stringify({
            sql: "SELECT * FROM historian_readings",
            explanation: "Read historian rows",
          })
        : "Local endpoint connected";
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: "local-test",
        object: "chat.completion",
        created: 1,
        model: body.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Expected local server address");
  const baseURL = `http://127.0.0.1:${address.port}/v1`;
  try {
    const generate = createSqlGenerationFunction(
      createSqlGeneratorAgent("test", "test-local", baseURL),
    );
    const proposal = await generate("Show readings");
    assert.equal(proposal.sql, "SELECT * FROM historian_readings");
    const review = createLocalSqlReviewFunction({
      baseURL,
      apiKey: "test",
      reviewModel: "test-local",
    });
    assert.deepEqual(await review({ question: "Show readings", ...proposal }), {
      approved: true,
      concerns: [],
    });
    const workflow = createHistorianQueryWorkflow(
      "test",
      "test-local",
      "http://facility.invalid",
      { modelBaseURL: baseURL },
    );
    const agent = createMainAgent("test", "test-local", workflow, baseURL);
    const response = await agent.generate("Say hello", { maxSteps: 1 });
    assert.equal(response.text, "Local endpoint connected");
    assert.deepEqual(paths, [
      "/v1/chat/completions",
      "/v1/chat/completions",
      "/v1/chat/completions",
    ]);
    assert.deepEqual(models, ["test-local", "test-local", "test-local"]);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
