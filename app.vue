<script setup>
import { onMounted } from "vue";
import { useAppLogger } from "~/composables/useLogger";

// Initialize logger
const logger = useAppLogger();

// Check authentication status on application load
onMounted(async () => {
  // Initial auth check using our auth composable
  try {
    const { checkAuth, error } = useAuth();
    const isAuthenticated = await checkAuth();
    logger.debug({ isAuthenticated }, "Initial auth check complete");

    if (error.value) {
      logger.error({ err: error.value }, "Auth check error");
    }
  } catch (error) {
    logger.error({ err: error }, "Error checking auth status");
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
