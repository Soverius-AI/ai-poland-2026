# AI Poland 2026 - Local AI Examples

Three applications for a 20-minute demonstration: native browser image/audio, browser-local RAG, and AG-UI with a local Mastra workflow. Adapted from the existing Soverius NomadCoder and AI DevCraft examples. No A2UI example is included.

| Example | What to show | Inference | URL |
| --- | --- | --- | --- |
| [01 - Native browser](examples/01-native-browser) | Passport image fills a form; microphone audio becomes text | Chrome Prompt API | http://localhost:4200 |
| [02 - Browser RAG](examples/02-browser-rag) | E5 finds cold-room manual passages; Gemma explains the evidence | Transformers.js / ONNX Runtime Web | http://localhost:4400 |
| [03 - AG-UI](examples/03-ag-ui) | Natural language becomes reviewed, read-only SQL and updates the existing UI | Local Chat Completions model + Mastra | http://localhost:4600 |

## Setup

Use Node.js **24.16 or a later 24.x** and **pnpm 11.19.0**. The examples have independent package and lockfiles so each can also be installed on its own.

```sh
pnpm run setup
pnpm build
pnpm test
```

Start only the example you need:

```sh
pnpm 01-browser-models
pnpm 02-rag
pnpm 03-agui
```

For AG-UI, first copy `examples/03-ag-ui/.env.example` to `.env` **inside that example** and configure/start your local model server. No cloud key is required. See the example README for the exact endpoint contract.

## Demonstrate

1. **Browser:** prepare image input; extract the synthetic sample into first name, last name, birth date, passport number, nationality and expiry. Prepare audio input; record and transcribe one short sentence in the same app.
2. **RAG:** ask about a cold room warming up when staff walk in and out. Find passages first, then ask locally. Show the selected evidence and page reference.
3. **AG-UI:** ask “Show the highest air temperature for each shift manager.” Follow generation, deterministic checking, local model review and database execution. Then ask “Switch to the reading log and filter to the Cooling room.”

The [presenter walkthrough](docs/DEMO.md) keeps the three showcases short. The apps perform real model calls; illustrative results are not substituted for inference. Unsupported APIs, download errors and model failures remain visible.

## Local Execution

Browser models need an initial download. Availability depends on the actual Chrome/device. RAG downloads its E5/Gemma weights into the current browser profile and origin. The AG-UI app uses `LOCAL_MODEL_BASE_URL`, defaulting to `http://127.0.0.1:8080/v1`; main-agent, SQL-generation and review calls all use that endpoint. There is no automatic hosted-model fallback.

App-shell caching, model caching and offline inference are separate. Rehearse fresh questions and reloads on the presentation machine before claiming disconnected operation.

## Verification And Sources

See [verification scope](docs/VERIFICATION.md), [source provenance](docs/SOURCES.json), and [attribution](docs/ATTRIBUTION.md). Build and fake-model test results do not establish real-device extraction quality, model reliability or offline readiness. Downloaded weights, credentials, databases and dependencies are excluded from Git.
