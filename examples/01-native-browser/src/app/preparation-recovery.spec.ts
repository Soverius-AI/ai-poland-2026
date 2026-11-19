import { afterEach, expect, it, vi } from 'vitest';
import { NativeBrowserAi } from './native-browser-ai';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('releases preparation when Chrome never reports progress or settles create', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('LanguageModel', {
    availability: vi.fn().mockResolvedValue('downloading'),
    create: vi.fn().mockReturnValue(new Promise(() => {})),
  });
  const ai = new NativeBrowserAi();
  await ai.checkAvailability('image');
  const preparation = ai.prepare('image').catch((error) => error);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(ai.states().image.preparing).toBe(false);
  expect(ai.states().image.ready).toBe(false);
  expect(ai.states().image.error).toMatch(/progress|respond/i);
  await preparation;
});

it('cancels a pending request and discards its late session without replacing a retry', async () => {
  let finishFirst: ((session: unknown) => void) | undefined;
  const first = new Promise((resolve) => {
    finishFirst = resolve;
  });
  const oldDestroy = vi.fn();
  const newDestroy = vi.fn();
  let firstSignal: AbortSignal | undefined;
  const create = vi
    .fn()
    .mockImplementationOnce((options: LanguageModelCreateOptions) => {
      firstSignal = options.signal;
      return first;
    })
    .mockResolvedValueOnce({ destroy: newDestroy });
  vi.stubGlobal('LanguageModel', { availability: vi.fn().mockResolvedValue('available'), create });
  const ai = new NativeBrowserAi();
  await ai.checkAvailability('image');
  const pending = ai.prepare('image');
  ai.reset('image');
  expect(ai.states().image.preparing).toBe(false);
  expect(firstSignal?.aborted).toBe(true);
  await pending;
  await ai.prepare('image');
  finishFirst?.({ destroy: oldDestroy });
  await Promise.resolve();
  await Promise.resolve();
  expect(oldDestroy).toHaveBeenCalledOnce();
  expect(newDestroy).not.toHaveBeenCalled();
  expect(ai.states().image.ready).toBe(true);
  ai.destroy();
});

it('continues a real progressing download instead of applying a fixed total timeout', async () => {
  vi.useFakeTimers();
  let monitor: EventTarget | undefined;
  vi.stubGlobal('LanguageModel', {
    availability: vi.fn().mockResolvedValue('downloading'),
    create: vi.fn().mockImplementation((options: LanguageModelCreateOptions) => {
      monitor = new EventTarget();
      options.monitor?.(monitor as CreateMonitor);
      return new Promise(() => {});
    }),
  });
  const ai = new NativeBrowserAi();
  await ai.checkAvailability('image');
  const pending = ai.prepare('image');
  await vi.advanceTimersByTimeAsync(59_000);
  const event = new Event('downloadprogress');
  Object.defineProperty(event, 'loaded', { value: 0.25 });
  monitor?.dispatchEvent(event);
  await vi.advanceTimersByTimeAsync(59_000);
  expect(ai.states().image.preparing).toBe(true);
  expect(ai.states().image.progress).toBe(0.25);
  ai.reset('image');
  await pending;
});

it('can refresh Chrome availability while preparation is pending without marking a session ready', async () => {
  const availability = vi.fn().mockResolvedValueOnce('downloading').mockResolvedValue('available');
  vi.stubGlobal('LanguageModel', {
    availability,
    create: vi.fn().mockReturnValue(new Promise(() => {})),
  });
  const ai = new NativeBrowserAi();
  await ai.checkAvailability('image');
  const pending = ai.prepare('image');
  await ai.checkAvailability('image');
  expect(ai.states().image.availability).toBe('available');
  expect(ai.states().image.ready).toBe(false);
  expect(ai.states().image.preparing).toBe(true);
  ai.reset('image');
  await pending;
});

it('opens an installed model immediately without waiting for a download click', async () => {
  const create = vi.fn().mockResolvedValue({ destroy: vi.fn() });
  vi.stubGlobal('LanguageModel', { availability: vi.fn().mockResolvedValue('available'), create });
  const ai = new NativeBrowserAi();
  await ai.checkAndPrepareInstalled('image');
  expect(create).toHaveBeenCalledOnce();
  expect(ai.states().image.ready).toBe(true);
  ai.destroy();
});

it.each(['downloadable', 'downloading', 'unavailable'])(
  'does not start a new session automatically while Chrome reports %s',
  async (availability) => {
    const create = vi.fn();
    vi.stubGlobal('LanguageModel', {
      availability: vi.fn().mockResolvedValue(availability),
      create,
    });
    const ai = new NativeBrowserAi();
    await ai.checkAndPrepareInstalled('image');
    expect(create).not.toHaveBeenCalled();
    expect(ai.states().image.ready).toBe(false);
  },
);
