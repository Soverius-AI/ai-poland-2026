import { afterEach, describe, expect, it, vi } from 'vitest';
import { NativeBrowserAi, inputOptions } from './native-browser-ai';
import { emptyPassport } from './passport';
afterEach(() => vi.unstubAllGlobals());
describe('native model lifecycle', () => {
  it('checks availability without starting a model download', async () => {
    const create = vi.fn();
    const availability = vi.fn().mockResolvedValue('downloadable');
    vi.stubGlobal('LanguageModel', { availability, create });
    const ai = new NativeBrowserAi();
    await ai.checkAvailability('image');
    expect(availability).toHaveBeenCalledWith(inputOptions.image);
    expect(create).not.toHaveBeenCalled();
    expect(ai.states().image.ready).toBe(false);
  });
  it('waits for create to resolve and isolates extraction in a disposable clone', async () => {
    const destroy = vi.fn();
    const prompt = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ ...emptyPassport(), firstName: 'Alex' }));
    const clone = vi.fn().mockResolvedValue({ prompt, destroy });
    let finish: ((value: unknown) => void) | undefined;
    const create = vi.fn().mockImplementation((options: LanguageModelCreateOptions) => {
      const monitor = new EventTarget();
      options.monitor?.(monitor as CreateMonitor);
      const event = new Event('downloadprogress');
      Object.defineProperty(event, 'loaded', { value: 1 });
      monitor.dispatchEvent(event);
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    vi.stubGlobal('LanguageModel', {
      availability: vi.fn().mockResolvedValue('available'),
      create,
    });
    const ai = new NativeBrowserAi();
    await ai.checkAvailability('image');
    const preparation = ai.prepare('image');
    expect(ai.states().image.progress).toBe(1);
    expect(ai.states().image.ready).toBe(false);
    finish?.({ clone, destroy: vi.fn() });
    await preparation;
    expect(create.mock.calls[0][0].expectedInputs).toEqual(inputOptions.image.expectedInputs);
    expect((await ai.extract(new Blob(['image']))).firstName).toBe('Alex');
    expect(destroy).toHaveBeenCalledOnce();
  });
  it('reports unsupported browsers and does not invent a remote fallback', async () => {
    vi.stubGlobal('LanguageModel', undefined);
    const ai = new NativeBrowserAi();
    await ai.checkAvailability('audio');
    expect(ai.states().audio.availability).toBe('unsupported');
    await expect(ai.prepare('audio')).rejects.toThrow();
  });
});
