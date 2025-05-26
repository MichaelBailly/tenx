import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    globals: true,
    environment: "nuxt",
    exclude: [
      "**/*.spec.js",
      "**/e2e/**",
      "node_modules/**",
      "dist/**",
      ".nuxt/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        ".nuxt/**",
        "coverage/**",
        "**/*.d.ts",
        "test/**",
      ],
    },
  },
});
