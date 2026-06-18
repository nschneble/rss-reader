import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the "@/*" path alias from tsconfig.json natively.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    // Tests run against a throwaway in-memory SQLite db (see client.ts, which
    // honors RSS_READER_DB) so they never touch the real data/reader.db.
    env: {
      RSS_READER_DB: ":memory:",
      NODE_ENV: "test",
    },
  },
});
