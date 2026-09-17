import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {},
});