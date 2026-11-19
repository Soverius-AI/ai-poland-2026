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

it('shows the actual create failure and allows a new session attempt', async () => {
  const create = vi
    .fn()
    .mockRejectedValueOnce(new DOMException('Model service unavailable.', 'NotReadableError'))
    .mockResolvedValueOnce({ destroy: vi.fn() });
  const availability = vi.fn();
  vi.stubGlobal('LanguageModel', { availability, create });
  const ai = new NativeBrowserAi();
  await expect(ai.prepare('image')).rejects.toThrow('Model service unavailable.');
  expect(ai.states().image.error).toBe('Model service unavailable.');
  expect(ai.states().image.preparing).toBe(false);
  await ai.prepare('image');
  expect(ai.states().image.ready).toBe(true);
  expect(ai.states().image.error).toBe('');
  expect(availability).not.toHaveBeenCalled();
  ai.destroy();
});
