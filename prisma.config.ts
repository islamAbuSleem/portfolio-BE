import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations must run against a DIRECT connection. The pooled endpoint
    // (host contains "-pooler") runs in transaction mode, which Prisma
    // Migrate cannot use. Set DIRECT_DATABASE_URL to the direct Neon URL and
    // leave DATABASE_URL pointing at the pooled one for runtime traffic.
    url: process.env.DIRECT_DATABASE_URL ?? env("DATABASE_URL"),
  },
});
