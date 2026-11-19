export interface PassportFields {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
  expiresOn: string;
}
export const emptyPassport = (): PassportFields => ({
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  passportNumber: '',
  nationality: '',
  expiresOn: '',
});
const keys = Object.keys(emptyPassport()) as (keyof PassportFields)[];
export const passportSchema = {
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])),
  required: keys,
};
export function parsePassport(text: string): PassportFields {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected passport fields as a JSON object.');
  const result = emptyPassport();
  if (Object.keys(value).some((key) => !keys.includes(key as keyof PassportFields)))
    throw new Error('Unexpected passport field.');
  for (const key of keys) {
    const field: unknown = Reflect.get(value, key);
    if (typeof field !== 'string' || field.length > 200) throw new Error(`Invalid field: ${key}.`);
    result[key] = field.trim();
  }
  for (const key of ['dateOfBirth', 'expiresOn'] as const) {
    const date = result[key];
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)
    ) {
      throw new Error(`Invalid calendar date in ${key}; expected YYYY-MM-DD.`);
    }
  }
  return result;
}
