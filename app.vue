<script setup>
import { onMounted } from "vue";

// Check authentication status on application load
onMounted(async () => {
  // Initial auth check using our auth composable
  try {
    const { checkAuth } = useAuth();
    const isAuthenticated = await checkAuth();
    console.log("Initial auth check complete, authenticated:", isAuthenticated);
  } catch (error) {
    console.error("Error checking auth status:", error);
  }
});
</script>

<template>
  <div><NuxtPage /></div>
</template>
