# Verification - 19 November 2026

Checked locally with Node.js 24.16.0 and pnpm 11.19.0.

| Example | Checks | Result |
| --- | --- | --- |
| Native browser | Angular production build; 6 parser/lifecycle tests | Passed |
| Browser RAG | Angular production build and offline-shell generation; 3 corpus/context tests; pipeline typecheck | Passed |
| Incident AG-UI | Angular/facility/Mastra production builds; agent typecheck; 29 agent/workflow tests and 13 facility-policy/integration tests | Passed |

There are **51 passing automated tests** across the three examples. The additional local-endpoint test uses the actual Mastra/AI SDK clients against a small local fake Chat Completions server; it verifies agent, generator and reviewer routing without downloading weights.

The browser check exercised sample-image-to-form application with a fake LanguageModel implementation, date/passport fields, manual correction and unsupported-browser behavior. WCAG 2 A/AA and WCAG 2.1 AA axe checks found no violations in that native app state. The RAG app initial view loaded. There were no browser runtime errors or external requests before model preparation in these checks.

## Not Established By These Checks

- Real Prompt API extraction/transcription on the presentation Chrome profile.
- New E5/Gemma inference or a disconnected RAG rehearsal.
- Actual local-model SQL quality, tool-call reliability or end-to-end latency.

No model server was available at the default localhost:8080 endpoint during this preparation. These results establish buildability, app flow and protocol/policy behavior, not real-model demo readiness. See DEMO.md for rehearsal steps. GitHub CI runs the independent builds/tests on Linux; its latest result is visible on the repository Actions page.
