import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Integration suites share one Supabase pooled connection (5-connection limit).
    // Running test files in parallel worker processes each opens its own Prisma
    // pool and exhausts it — keep suites sequential to avoid connection timeouts.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
