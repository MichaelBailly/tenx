<script setup lang="ts">
// No props or logic needed for static navigation
</script>

<template>
  <div class="mb-4 border-b border-gray-700">
    <div class="flex space-x-4">
      <button
        class="text-yellow-400 border-b-2 border-yellow-400 pb-2 px-1 font-medium"
      >
        All Songs
      </button>
      <NuxtLink
        to="/app/artists"
        class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium"
      >
        By Artist
      </NuxtLink>
      <button class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium">
        By Album
      </button>
      <button class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium">
        Recent
      </button>
    </div>
  </div>
</template>
