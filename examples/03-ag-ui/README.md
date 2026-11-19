# Incident Queries With AG-UI, Mastra And Local Inference

The existing incident-management app adapted from the NomadCoder / AI DevCraft example. The Angular UI, facility API, SQLite historian, Mastra workflow and model calls run on your configured infrastructure. The main agent, SQL generator and model reviewer share a local OpenAI-compatible Chat Completions endpoint; there are no OpenRouter/Jev calls or automatic hosted fallback in this version.

## Start

Start a local model server exposing `/v1/chat/completions`. Use a model that supports tool calling and strict JSON-schema output; the default model alias in this demo is **gemma-local**. The concrete GGUF, quantization, hardware and inference engine are your server configuration, not files committed in this repo.

For llama.cpp with an already-downloaded model:

```sh
llama-server -m /path/to/model.gguf --alias gemma-local --host 127.0.0.1 --port 8080 --ctx-size 16384 --jinja
```

Then, from this example:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

The configured endpoint is logged at startup. `.env.example` defaults to localhost:8080/v1 and a non-secret local API-key placeholder. Set LOCAL_MODEL_BASE_URL, LOCAL_MODEL_NAME and optionally LOCAL_REVIEW_MODEL to match your internal server. For a remote server on your own infrastructure, provide its explicit URL and authentication. No server selection or cloud fallback happens automatically.

- App: http://localhost:4600
- Facility API: http://127.0.0.1:3101
- Mastra Studio/API: http://localhost:4211

## Show

Ask **Show the highest air temperature for each shift manager.** The workflow generates SQL, applies deterministic statement checks, reviews intent/result shape with the local model and asks the facility service to validate/execute against the read-only historian. Results appear in the existing table. Inspect Query and review or the Studio trace.

Then ask **Switch to the reading log and filter to the Cooling room.** Frontend tools discover valid options and update the existing view. AG-UI carries messages/tool interactions; Mastra owns orchestration. No A2UI is involved.

Review errors, malformed structured output, rejected queries and provider errors stop execution. Model review supplements rather than replaces the deterministic SQL policy, read-only database access, result-shape checks and execution limits. The local reviewer uses a strict ordinary Chat Completions schema; it does not simulate Jev probabilities or claim equivalent quality.

## Check

```sh
pnpm build
pnpm test
```

Retained workflow and database-policy tests use injected model functions or fake responses; local reviewer tests check the endpoint, schema and fail-closed responses. These do not establish the chosen model's SQL/tool reliability. Rehearse with the actual model before presenting. The fixed demo operator and alarm controls are inherited workshop behavior, not production authentication.

`pnpm reset:demo` resets only this example's local demo database; it is an explicit action. Runtime databases and traces are excluded from Git. The upstream source reference remains in SOURCE.md; its old hosted setup has been replaced here.
