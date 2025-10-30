import { ulid } from 'ulid';
import { z } from 'zod';

export const LookupTypeEnum = z.enum([
  'country',
  'marketCategory',
  'industry',
  'fundamentalNewsCategory',
]);

export const LookupSchema = z.object({
  id: z.string(),
  value: z.string(),
  type: z.string(),
  shortName: z.string().optional(),
});

export type LookupType = z.infer<typeof LookupTypeEnum>;
export type Lookup = Required<z.infer<typeof LookupSchema>>;

export const mockLookup = (): Lookup => {
  return {
    id: ulid(),
    value: 'Test Lookup',
    type: LookupTypeEnum.enum.country,
    shortName: 'TL',
  };
};
