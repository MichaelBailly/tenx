<script setup lang="ts">
// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});
</script>

<template>
  <!-- Welcome message shown only on /app route -->
  <div v-if="$route.path === '/app'" class="text-center py-12">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-24 w-24 text-yellow-400 mx-auto"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
    <h2 class="mt-6 text-3xl font-bold text-yellow-400">Welcome to tenX</h2>
    <p class="mt-4 text-gray-300 max-w-md mx-auto">
      Your personal music library and player. Access your music collection
      anywhere, anytime.
    </p>
    <div class="mt-8">
      <NuxtLink
        to="/app/songs"
        class="px-6 py-3 border border-transparent rounded-md text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 shadow-lg"
      >
        Browse My Songs
      </NuxtLink>
    </div>

    <!-- Featured section -->
    <div
      class="mt-16 bg-gray-800 rounded-lg p-6 max-w-3xl mx-auto border border-gray-700"
    >
      <h3 class="text-xl font-bold text-yellow-400 mb-4">Recently Added</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-gray-700 rounded-md p-3 hover:bg-gray-600 transition cursor-pointer"
        >
          <div
            class="h-32 bg-gray-800 rounded mb-2 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 15V3m0 12l-4 4m4-4l4 4M3 9h18"
              />
            </svg>
          </div>
          <p class="text-gray-200 text-sm font-medium">Sample Song {{ i }}</p>
          <p class="text-gray-400 text-xs">Artist {{ i }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Route content for nested pages -->
  <NuxtPage v-else />
</template>
