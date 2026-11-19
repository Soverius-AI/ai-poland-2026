# Browser-Local Cold-Room RAG

The existing AI DevCraft Optyma Cooler assistant, extracted into a standalone application. Multilingual E5 embeds the question; PGlite searches the local index; Gemma explains the selected text. Both model workers use Transformers.js over ONNX Runtime Web. E5 uses WASM/q8; generation uses WebGPU with a WASM fallback.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:4400. Click Prepare local models while online and wait for both models. Ask: **The cold room warms up when staff keep walking in and out. What does the manual suggest?** Use Find passages first, then Ask locally. Expected relevant evidence is Optyma Cooler, page 6, entry 2.6. The corpus has 13 teaching paraphrases, not the whole manual.

For the offline app shell:

```sh
pnpm build
pnpm preview
```

Keep the same browser profile and localhost:4400 origin; cached weights from a different origin/profile do not prepare this one. Rehearse a fresh offline question and reload separately. The source PDF link needs networking. No hosted inference or API key is used.

```sh
pnpm test
pnpm typecheck:pipeline
```

The index is already included. Optional corpus regeneration uses `pnpm build:index`, followed by `pnpm verify:recall`. These Node-side embedding commands also require the onnxruntime-node native runtime; the browser demo does not. Enable that package's build/install script in pnpm-workspace.yaml before using Node-side regeneration and install the runtime for your platform. Rebuilding the browser app never requires regenerating embeddings.

See ATTRIBUTION.md for source/manual notices. Model IDs are in the embedding and generation workers under `src/app/domains/manual/data/workers/`. This is the ONNX browser app, not the later llama.cpp RAG Explorer.
