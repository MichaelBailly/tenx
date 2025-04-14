import { computed, ref } from "vue";
import type { ClientUser } from "~/types/mongo";

// Types
type AuthState = {
  authenticated: boolean;
  user: ClientUser | null;
  loading: boolean;
  error: string | null;
};

type AuthResponse = {
  authenticated: boolean;
  userId: string | null;
  username: string | null;
};

// Create a global store for auth state
const authState = ref<AuthState>({
  authenticated: false,
  user: null,
  loading: false,
  error: null,
});

export function useAuth() {
  // Check authentication status
  const checkAuth = async () => {
    authState.value.loading = true;
    authState.value.error = null;

    try {
      // Use direct fetch for better error handling
      const response = await fetch("/api/auth/status");

      if (!response.ok) {
        throw new Error(
          `Failed to check auth status: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as AuthResponse;

      if (process.env.NODE_ENV !== "production") {
        console.log("useAuth: Auth check result:", data);
      }

      if (data.authenticated && data.userId) {
        authState.value.authenticated = true;
        authState.value.user = {
          userId: data.userId,
          username: data.username || "",
        };
      } else {
        authState.value.authenticated = false;
        authState.value.user = null;
      }
    } catch (error) {
      console.error("useAuth: Auth check error:", error);
      authState.value.authenticated = false;
      authState.value.user = null;
      authState.value.error =
        error instanceof Error
          ? error.message
          : "Failed to check authentication";
    } finally {
      authState.value.loading = false;
    }

    return authState.value.authenticated;
  };

  // Handle logout
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error(
          `Logout failed: ${response.status} ${response.statusText}`
        );
      }

      authState.value.authenticated = false;
      authState.value.user = null;

      // Navigate to login
      return navigateTo("/login");
    } catch (error) {
      console.error("useAuth: Logout error:", error);
      authState.value.error =
        error instanceof Error ? error.message : "Logout failed";
    }
  };

  return {
    // State
    authState,

    // Computed
    isAuthenticated: computed(() => authState.value.authenticated),
    user: computed(() => authState.value.user),
    isLoading: computed(() => authState.value.loading),
    error: computed(() => authState.value.error),

    // Methods
    checkAuth,
    logout,
  };
}
