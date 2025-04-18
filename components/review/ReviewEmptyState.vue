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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <h2 class="mt-4 text-lg font-medium text-yellow-400">No songs to review</h2>
    <p class="mt-2 text-sm text-gray-400">
      Great job! You've reviewed all your songs. Upload more music to add to
      your collection.
    </p>
  </div>
</template>
