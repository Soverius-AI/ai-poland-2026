import { describe, expect, it } from 'vitest';
import { emptyPassport, parsePassport } from './passport';
describe('passport response validation', () => {
  it('accepts a complete extraction and preserves missing fields as empty strings', () => {
    expect(
      parsePassport(
        JSON.stringify({ ...emptyPassport(), firstName: 'Alex', dateOfBirth: '1988-04-12' }),
      ),
    ).toEqual({ ...emptyPassport(), firstName: 'Alex', dateOfBirth: '1988-04-12' });
  });
  it('rejects a missing field or invented property instead of applying partial/unexpected data', () => {
    expect(() => parsePassport('{"firstName":"Alex"}')).toThrow();
    expect(() => parsePassport(JSON.stringify({ ...emptyPassport(), confidence: 1 }))).toThrow();
  });
  it('rejects impossible dates and a non-string passport number', () => {
    expect(() =>
      parsePassport(JSON.stringify({ ...emptyPassport(), dateOfBirth: '1988-02-31' })),
    ).toThrow();
    expect(() =>
      parsePassport(JSON.stringify({ ...emptyPassport(), passportNumber: 12 })),
    ).toThrow();
  });
});
