<script setup lang="ts">
const _props = defineProps<{ error: string | null }>();
const emit = defineEmits<{ (e: "retry"): void }>();

function handleRetry() {
  emit("retry");
}
</script>

<template>
  <div class="bg-red-900/30 p-4 rounded-md border border-red-800">
    <p class="text-red-400">{{ error }}</p>
    <button
      class="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      tabindex="0"
      aria-label="Try again"
      @click="handleRetry"
      @keydown.enter="handleRetry"
    >
      Try Again
    </button>
  </div>
</template>
