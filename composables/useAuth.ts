import { computed, ref } from "vue";

// Types
type User = {
  userId: string;
  // Add other user fields as needed
};

type AuthState = {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
};

type AuthResponse = {
  authenticated: boolean;
  userId: string | null;
};

// Create a global store for auth state
const authState = ref<AuthState>({
  authenticated: false,
  user: null,
  loading: false,
});

export function useAuth() {
  // Check authentication status
  const checkAuth = async () => {
    authState.value.loading = true;
    try {
      const { data } = await useFetch<AuthResponse>("/api/auth/status");
      console.log("useAuth: Auth check result:", data.value);

      if (data.value?.authenticated && data.value.userId) {
        authState.value.authenticated = true;
        authState.value.user = {
          userId: data.value.userId,
        };
      } else {
        authState.value.authenticated = false;
        authState.value.user = null;
      }
    } catch (error) {
      console.error("useAuth: Auth check error:", error);
      authState.value.authenticated = false;
      authState.value.user = null;
    } finally {
      authState.value.loading = false;
    }

    return authState.value.authenticated;
  };

  // Handle logout
  const logout = async () => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
      authState.value.authenticated = false;
      authState.value.user = null;

      // Navigate to login
      return navigateTo("/login");
    } catch (error) {
      console.error("useAuth: Logout error:", error);
    }
  };

  return {
    // State
    authState,

    // Computed
    isAuthenticated: computed(() => authState.value.authenticated),
    user: computed(() => authState.value.user),
    isLoading: computed(() => authState.value.loading),

    // Methods
    checkAuth,
    logout,
  };
}
