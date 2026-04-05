import { z } from 'zod';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('dark'),
  language: z.enum(['pt', 'en', 'es']).default('pt'),
  privacyMode: z.boolean().default(false),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }).optional(),
  currency: z.string().length(3).default('BRL'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  completedTours: z.array(z.string()).optional(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Validate and parse preferences
export function validatePreferences(data: unknown): UserPreferences {
  return UserPreferencesSchema.parse(data);
}

// Safe parse (returns success/error instead of throwing)
export function safeParsePreferences(data: unknown): {
  success: boolean;
  data?: UserPreferences;
  error?: z.ZodError;
} {
  const result = UserPreferencesSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}