import { defineConfig } from 'drizzle-kit';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in .env');
}

export default defineConfig({
  out: './drizzle',
  schema: './server/database/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
