<script setup lang="ts">
// No props needed
</script>

<template>
  <div class="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-16 w-16 text-gray-600 mx-auto"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
    <h2 class="mt-4 text-lg font-medium text-yellow-400">
      No songs in your library
    </h2>
    <p class="mt-2 text-sm text-gray-400">
      Upload some music to get started.
    </p>
  </div>
</template>
