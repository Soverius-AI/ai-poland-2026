# Presenter Walkthrough

## Native Browser - About 3.5 Minutes

Run `pnpm native`, open localhost:4200 in desktop Chrome and prepare both modalities before the talk. Availability checks do not download. Download-and-prepare is an explicit action; a session becomes ready only after creation resolves.

1. Click **Extract sample passport**. Inspect the source image and the six form fields. The sample is entirely synthetic: Alex Morgan, 1988-04-12, D00000001, Demo Republic, expiry 2032-04-12.
2. Correct one field manually. Explain that JSON shape is validated and the person reviews the extraction; this is not identity verification or form submission.
3. In the same app, record “The cooling room is too warm.” Stop, then click **Transcribe**. Show the returned text. Speech synthesis is outside this example.

The two modalities have separate preparation states so audio being unsupported does not prevent image extraction. Requests clone an empty prepared session and dispose of it afterwards, keeping unrelated inputs out of each other's conversation history.

## Browser RAG - About 3 Minutes

Run `pnpm rag`. For offline rehearsal use `pnpm --dir examples/02-browser-rag build`, then `pnpm rag:preview`, using the same localhost:4400 origin/profile.

Prepare models before the talk. Ask:

> The cold room warms up when staff keep walking in and out. What does the manual suggest?

1. Click **Find passages**. E5 embeds the question and local vector search returns evidence without a generative LLM.
2. Point to Optyma Cooler, page 6, entry 2.6. Optionally paraphrase: “Warm air keeps getting into the refrigerated room during deliveries. What should we check?”
3. Click **Ask locally**. Gemma receives the question and retrieved text. Show the source label and context panel. The answer should discuss the doorway/seals and limiting warm-air entry; treat this as a possible cause, not a diagnosis.

Skip a long RAG-on/off comparison if time is tight. The corpus has 13 teaching paraphrases, not the full manual.

## AG-UI / Mastra - About 3.5 Minutes

Start the local model server, then `pnpm agui`. Open localhost:4300 and Mastra Studio at localhost:4211 side by side.

> Show the highest air temperature for each shift manager.

Follow SQL generation → deterministic preflight → local model review → validated execution. Inspect the proposed SQL or workflow trace and the resulting table. Main-agent, generator and reviewer all use the configured local endpoint.

Then ask:

> Switch to the reading log and filter to the Cooling room.

Show the frontend tool updating the existing view and filters. Skip alarm approval in the 20-minute version. Retained alarm controls belong to the original app; this repo does not add an A2UI showcase.

## Before Going On Stage

- Prepare weights and browser sessions online; keep the same origin/profile for rehearsal.
- Check microphone permission and audio-input support.
- Confirm the configured local model supports tool calling and strict JSON-schema responses, and rehearse the complete incident request.
- If a model fails or review rejects the query, show that result. Do not substitute a fake success. A separately recorded, clearly identified fallback can be prepared after a successful rehearsal.
