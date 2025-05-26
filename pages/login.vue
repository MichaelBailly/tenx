<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const username = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const router = useRouter();

const handleSubmit = async () => {
  error.value = "";
  isLoading.value = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Invalid credentials");
    }

    // Redirect to /app on success
    router.push("/app");
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "An error occurred during login";
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // Check if already authenticated using our auth composable
  const { checkAuth } = useAuth();
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    // Already authenticated, redirect to app
    router.push("/app");
  }
});

definePageMeta({
  layout: "default",
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
      <div>
        <h1 class="text-3xl font-bold text-center text-gray-900">tenX</h1>
        <h2 class="mt-6 text-center text-xl text-gray-600">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input id="username" v-model="username" name="username" type="text" required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Username" aria-label="Username" :disabled="isLoading" />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" v-model="password" name="password" type="password" required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password" aria-label="Password" :disabled="isLoading" />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center" role="alert">
          {{ error }}
        </div>

        <div>
          <button type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            aria-label="Sign in" :disabled="isLoading">
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign in</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
