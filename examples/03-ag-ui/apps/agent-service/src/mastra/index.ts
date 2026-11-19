import { localModelConfig } from "./local-model";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createMainAgent } from "./agents/main/agent";
import { createHistorianQueryWorkflow } from "./workflows/historian-query/workflow";

const packageRoot = process.cwd();
const environmentPath = resolve(packageRoot, "../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const storagePath = resolve(
  process.env["MASTRA_STORAGE_PATH"] ??
    resolve(packageRoot, "data/mastra.sqlite"),
);
mkdirSync(dirname(storagePath), { recursive: true });

const { apiKey, model, baseURL, reviewModel } = localModelConfig();
console.log(
  `Model endpoint: ${baseURL} · generation: ${model} · review: ${reviewModel}`,
);
const facilityBaseUrl =
  process.env["FACILITY_BASE_URL"] || "http://127.0.0.1:3101";

export const historianQueryWorkflow = createHistorianQueryWorkflow(
  apiKey,
  model,
  facilityBaseUrl,
  { modelBaseURL: baseURL, reviewModel },
);

export const mainAgent = createMainAgent(
  apiKey,
  model,
  historianQueryWorkflow,
  baseURL,
);

export const mastra = new Mastra({
  server: { port: Number(process.env["MASTRA_PORT"] || "4211") },
  agents: { default: mainAgent },
  workflows: { historianQueryWorkflow },
  storage: new LibSQLStore({
    id: "packt-workshop-storage",
    url: `file:${storagePath}`,
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "packt-workshop-agent",
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
});
