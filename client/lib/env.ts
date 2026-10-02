import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_API_URL is required')
    .default('http://localhost:3001'),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => ` - [${issue.path.join('.') || 'root'}]: ${issue.message}`)
    .join('\n');
  console.error(
    `\n❌ Invalid Frontend Environment Configuration:\n${formattedErrors}\n`,
  );
  throw new Error(
    `Invalid Frontend Environment Configuration:\n${formattedErrors}`,
  );
}

export const env = parsed.data;
