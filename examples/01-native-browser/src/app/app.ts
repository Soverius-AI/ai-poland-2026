import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ImageUpload } from './image-upload/image-upload';
import { AudioRecording } from './audio-recording/audio-recording';
import { InputKind, NativeBrowserAi } from './native-browser-ai';
import { emptyPassport } from './passport';
@Component({
  selector: 'app-root',
  imports: [FormField, ImageUpload, AudioRecording],
  template: `
    <header>
      <p class="eyebrow">AI Poland 2026 · Native Browser</p>
      <h1>Images and voice in one app</h1>
      <p>Chrome Prompt API. Inference stays in this browser.</p>
    </header>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
    }
    <section class="preparation" aria-label="Model preparation">
      @for (kind of kinds; track kind) {
        @let state = ai.states()[kind];
        <article>
          <h2>{{ kind === 'image' ? 'Image input' : 'Audio input' }}</h2>
          <p role="status">{{ state.ready ? 'Ready' : state.availability }}</p>
          @if (state.preparing) {
            <progress
              max="1"
              [attr.value]="state.progress ?? null"
              aria-label="Model preparation progress"
            ></progress>
          }
          <button
            type="button"
            (click)="prepare(kind)"
            [disabled]="
              busy() ||
              state.ready ||
              ['checking', 'unsupported', 'unavailable'].includes(state.availability)
            "
          >
            {{ state.availability === 'available' ? 'Prepare session' : 'Download and prepare' }}
          </button>
          <button type="button" (click)="ai.checkAvailability(kind)" [disabled]="busy()">
            Check again
          </button>
          <button type="button" (click)="ai.reset(kind)" [disabled]="busy() || !state.ready">
            Reset session
          </button>
          @if (state.error) {
            <p role="alert" class="error">{{ state.error }}</p>
          }
        </article>
      }
    </section>
    <div class="columns">
      <section>
        <h2>Passport image</h2>
        <p>Use the synthetic sample or upload an image.</p>
        <fieldset [disabled]="busy() || !ai.states().image.ready">
          <legend class="sr-only">Passport image input</legend>
          <button type="button" (click)="extractSample()">Extract sample passport</button>
          <app-image-upload (parse)="extract($event)" />
        </fieldset>
        <a href="sample-passport.png" target="_blank" rel="noopener">View the synthetic sample</a>
      </section>
      <section>
        <h2>Extracted fields</h2>
        <p>Review and correct the values. Nothing is submitted.</p>
        <div class="fields">
          <label>First name<input autocomplete="off" [formField]="passportForm.firstName" /></label>
          <label>Last name<input autocomplete="off" [formField]="passportForm.lastName" /></label>
          <label>Date of birth<input type="date" [formField]="passportForm.dateOfBirth" /></label>
          <label
            >Passport number<input autocomplete="off" [formField]="passportForm.passportNumber"
          /></label>
          <label
            >Nationality<input autocomplete="off" [formField]="passportForm.nationality"
          /></label>
          <label>Expiry date<input type="date" [formField]="passportForm.expiresOn" /></label>
        </div>
        <button type="button" (click)="passport.set(emptyPassport())" [disabled]="busy()">
          Clear fields
        </button>
      </section>
    </div>
    <section>
      <h2>Voice transcription</h2>
      <p>Record a short sentence, then transcribe it locally.</p>
      <fieldset [disabled]="busy() || !ai.states().audio.ready">
        <legend class="sr-only">Voice recording</legend>
        <app-audio-recording (parse)="transcribe($event)" />
      </fieldset>
      <label>Transcription<textarea rows="3" readonly [value]="transcription()"></textarea></label>
    </section>
    @if (working()) {
      <p role="status" class="working">{{ working() }}</p>
    }
  `,
})
export class App implements OnInit, OnDestroy {
  readonly ai = inject(NativeBrowserAi);
  readonly kinds: InputKind[] = ['image', 'audio'];
  readonly passport = signal(emptyPassport());
  readonly passportForm = form(this.passport);
  readonly emptyPassport = emptyPassport;
  readonly transcription = signal('');
  readonly error = signal('');
  readonly working = signal('');
  readonly busy = computed(
    () => !!this.working() || this.kinds.some((kind) => this.ai.states()[kind].preparing),
  );
  ngOnInit() {
    for (const kind of this.kinds) void this.ai.checkAvailability(kind);
  }
  ngOnDestroy() {
    this.ai.destroy();
  }
  async prepare(kind: InputKind) {
    await this.run('', () => this.ai.prepare(kind));
  }
  async extract(file: Blob) {
    await this.run('Reading the passport…', async () => {
      this.passport.set(emptyPassport());
      this.passport.set(await this.ai.extract(file));
    });
  }
  async extractSample() {
    await this.run('Reading the sample passport…', async () => {
      const response = await fetch('sample-passport.png');
      if (!response.ok) throw new Error('The sample passport could not be loaded.');
      this.passport.set(emptyPassport());
      this.passport.set(await this.ai.extract(await response.blob()));
    });
  }
  async transcribe(recording: Blob) {
    await this.run('Transcribing…', async () => {
      this.transcription.set('');
      this.transcription.set(await this.ai.transcribe(recording));
    });
  }
  private async run(label: string, action: () => Promise<unknown>) {
    this.error.set('');
    this.working.set(label);
    try {
      await action();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The request failed.');
    } finally {
      this.working.set('');
    }
  }
}
