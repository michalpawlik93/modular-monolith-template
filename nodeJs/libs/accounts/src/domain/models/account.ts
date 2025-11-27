import { ulid } from 'ulid';
import { z } from 'zod';

export const AccountStatusEnum = z.enum(['active', 'disabled']);

export const AccountSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.string().optional(),
  status: AccountStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountStatus = z.infer<typeof AccountStatusEnum>;
export type Account = Required<z.infer<typeof AccountSchema>>;

export const mockAccount = (): Account => ({
  id: ulid(),
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'user',
  status: AccountStatusEnum.enum.active,
  createdAt: new Date(),
  updatedAt: new Date(),
});
