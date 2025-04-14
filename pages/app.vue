<script setup lang="ts">
// Handle logout functionality
const handleLogout = async () => {
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
    // Redirect to login page after successful logout
    navigateTo("/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navigation header with logout button -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">tenX</h1>
          </div>
          <div class="flex items-center">
            <button
              @click="handleLogout"
              @keydown.enter="handleLogout"
              class="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Log out"
              tabindex="0"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 class="text-3xl font-bold text-gray-900">Welcome to tenX</h2>
      <p class="mt-4 text-gray-600">Your music library awaits...</p>
    </main>
  </div>
</template>
