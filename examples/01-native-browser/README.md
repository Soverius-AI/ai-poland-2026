# Native Browser: Passport And Voice

An Angular app using Chrome's Prompt API for image-to-form extraction and audio transcription. Adapted from the NomadCoder image/audio examples; the current minimal translation checkpoint was replaced with the requested two-modality application.

```sh
pnpm install --frozen-lockfile
pnpm start
```

Open http://localhost:4200 in desktop Chrome. Check availability, then explicitly prepare each modality. Audio input requires compatible GPU support. No API key or inference backend is used, and there is no hosted fallback. Initial model preparation may download browser-managed resources.

Extract the synthetic sample or upload an image. Fields are first name, last name, birth date, passport number, nationality and expiry. Missing/unreadable values stay empty; malformed JSON, unexpected fields and impossible dates are rejected. Review/edit values locally: nothing is submitted. Each extraction starts with empty fields so an older passport's values are not retained.

Record a short sentence, stop, then click Transcribe. Browser microphone permission is required. The app returns text rather than synthesized speech. Model availability and preparation are independent for image and audio.

```sh
pnpm build
pnpm test --watch=false
```

Source map: `src/app/native-browser-ai.ts` owns capability checks, explicit preparation and isolated model sessions; `passport.ts` owns schema/validation; `app.ts` owns Signal Forms and application composition; image-upload/audio-recording components own browser input capture. The SVG/PNG sample under `public/` is entirely synthetic.

Official reference: https://developer.chrome.com/docs/ai/prompt-api . Real multimodal inference and offline behavior require rehearsal on the exact Chrome profile and device. Automated lifecycle tests use a fake LanguageModel API and do not establish browser eligibility or model accuracy.
