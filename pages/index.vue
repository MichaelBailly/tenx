<script setup lang="ts">
// Define page meta to use our app layout
definePageMeta({
  layout: "default",
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <NuxtLink
      to="/login"
      class="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      aria-label="Go to login page"
    >
      Sign in
    </NuxtLink>
  </div>
</template>
