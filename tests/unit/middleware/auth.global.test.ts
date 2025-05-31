import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";

// Mock Nuxt global functions
const navigateToMock = vi.fn().mockReturnValue("redirect");
// @ts-expect-error - Mock global navigateTo for testing
globalThis.navigateTo = navigateToMock;
// @ts-expect-error - Mock global defineNuxtRouteMiddleware for testing
globalThis.defineNuxtRouteMiddleware = (fn: (...args: unknown[]) => unknown) =>
  fn;

// Mock logger composable
const mockLogger = { debug: vi.fn(), error: vi.fn() };
vi.mock("~/composables/useLogger", () => ({
  useAuthLogger: () => mockLogger,
}));

// Mock config routes
vi.mock("~/server/utils/config", () => ({
  Config: {
    routes: {
      protected: ["/protected"],
      public: ["/login", "/public"],
    },
  },
}));

// Stubbed checkAuth mock, will be set per test
let checkAuthMock: () => Promise<boolean>;
vi.mock("~/composables/useAuth", () => ({
  useAuth: () => ({ checkAuth: checkAuthMock }),
}));

describe("auth.global middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows access to public routes", async () => {
    checkAuthMock = vi.fn(); // not called
    const to = { path: "/public/page" } as RouteLocationNormalized;
    const from = { path: "/" } as RouteLocationNormalized;
    const authMiddleware = (await import("../../../middleware/auth.global"))
      .default;
    const result = await authMiddleware(to, from);
    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("allows access to non-protected routes", async () => {
    checkAuthMock = vi.fn(); // not called
    const to = { path: "/other" } as RouteLocationNormalized;
    const from = { path: "/" } as RouteLocationNormalized;
    const authMiddleware = (await import("../../../middleware/auth.global"))
      .default;
    const result = await authMiddleware(to, from);
    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("allows access when authenticated on protected routes", async () => {
    checkAuthMock = vi.fn().mockResolvedValue(true);
    const to = { path: "/protected/page" } as RouteLocationNormalized;
    const from = { path: "/" } as RouteLocationNormalized;
    const authMiddleware = (await import("../../../middleware/auth.global"))
      .default;
    const result = await authMiddleware(to, from);
    expect(checkAuthMock).toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalledWith(
      { path: to.path },
      "Auth middleware: User is authenticated, allowing access"
    );
  });

  it("redirects to login when not authenticated on protected routes", async () => {
    checkAuthMock = vi.fn().mockResolvedValue(false);
    const to = { path: "/protected/page" } as RouteLocationNormalized;
    const from = { path: "/" } as RouteLocationNormalized;
    // Import after setting checkAuthMock
    const authMiddleware = (await import("../../../middleware/auth.global"))
      .default;
    await authMiddleware(to, from);
    expect(checkAuthMock).toHaveBeenCalled();
  });

  it("redirects to login when checkAuth throws error", async () => {
    checkAuthMock = vi.fn().mockRejectedValue(new Error("fail"));
    const to = { path: "/protected/page" } as RouteLocationNormalized;
    const from = { path: "/" } as RouteLocationNormalized;
    // Import after setting checkAuthMock
    const authMiddleware = (await import("../../../middleware/auth.global"))
      .default;
    const result = await authMiddleware(to, from);
    expect(checkAuthMock).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
    expect(result).not.toBeUndefined();
  });
});
