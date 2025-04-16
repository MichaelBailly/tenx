<script setup lang="ts">
// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});
</script>

<template>
  <!-- Welcome message shown only on /app route -->
  <div v-if="$route.path === '/app'">
    <h2 class="text-3xl font-bold text-gray-900">Welcome to tenX</h2>
    <p class="mt-4 text-gray-600">Your music library awaits...</p>
    <div class="mt-8">
      <NuxtLink
        to="/app/songs"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Browse My Songs
      </NuxtLink>
    </div>
  </div>

  <!-- Route content for nested pages -->
  <NuxtPage v-else />
</template>
