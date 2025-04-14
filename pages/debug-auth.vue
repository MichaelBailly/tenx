<script setup>
import { onMounted, ref } from "vue";

const authState = ref({
  loading: true,
  authenticated: false,
  userId: null,
  username: null,
  error: null,
});

async function checkAuth() {
  authState.value.loading = true;
  authState.value.error = null;

  try {
    // Use fetch with error handling
    const response = await fetch("/api/auth/status");

    if (!response.ok) {
      authState.value.error = `Error: ${response.status} ${response.statusText}`;
      authState.value.authenticated = false;
      return;
    }

    const data = await response.json();

    authState.value.authenticated = !!data.authenticated;
    authState.value.userId = data.userId || null;
    authState.value.username = data.username || null;
  } catch (err) {
    console.error("Error checking auth:", err);
    authState.value.error = err.message || "Error checking authentication";
    authState.value.authenticated = false;
  } finally {
    authState.value.loading = false;
  }
}

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <h1 class="text-3xl font-bold mb-4">Authentication Debug</h1>

    <div v-if="authState.loading" class="text-gray-600">
      Loading authentication state...
    </div>

    <div v-else-if="authState.error" class="text-red-600 mb-4">
      <p>{{ authState.error }}</p>
      <button
        @click="checkAuth"
        class="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>

    <div v-else class="bg-white shadow-md rounded p-4">
      <div class="text-lg mb-2">
        <span class="font-bold">Authentication Status:</span>
        <span
          :class="authState.authenticated ? 'text-green-600' : 'text-red-600'"
        >
          {{ authState.authenticated ? "Authenticated" : "Not Authenticated" }}
        </span>
      </div>

      <div v-if="authState.authenticated" class="mb-4">
        <div>
          <span class="font-bold">User ID:</span> {{ authState.userId }}
        </div>
        <div v-if="authState.username">
          <span class="font-bold">Username:</span> {{ authState.username }}
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button
          @click="checkAuth"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Status
        </button>

        <NuxtLink
          to="/app"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go to App
        </NuxtLink>

        <NuxtLink
          to="/login"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Go to Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
