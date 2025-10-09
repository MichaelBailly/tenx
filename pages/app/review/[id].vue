<script setup lang="ts">
import { computed } from "vue";
import SongEditForm from "~/components/review/SongEditForm.vue";
import SongsErrorState from "~/components/shared/SongsErrorState.vue";
import SongsLoadingState from "~/components/shared/SongsLoadingState.vue";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import { useReviewSong } from "~/composables/useReviewSong";
import type { ApiSong } from "~/types/api";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

// Get the song ID from the route
const route = useRoute();
const songId = route.params.id as string;

const {
  song,
  loading,
  error,
  saveSong,
  cancelEditing,
} = useReviewSong(songId);

const isLoading = computed(() => loading.value);
const hasError = computed(() => !!error.value);
const hasSong = computed(() => !!song.value);

// Handler for retry button
const handleRetry = () => {
  // Reload the page or refetch
  navigateTo(route.fullPath, { replace: true });
};

// Handle save for song edit form
const handleSaveSong = async (updatedSong: ApiSong) => {
  const success = await saveSong(updatedSong);
  if (success) {
    // Show a success notification
    const notification = console.log;
    notification("Song updated and approved successfully");
    // Navigate back to the review list
    navigateTo('/app/review');
  } else {
    // Show an error notification
    const notification = console.error;
    notification("Failed to update song");
  }
};

// Handle cancel
const handleCancel = () => {
  cancelEditing();
  // Navigate back to the review list
  navigateTo('/app/review');
};
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="review" />

    <!-- Title area -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-yellow-400">Review Song</h1>
      <button
        class="text-gray-400 hover:text-gray-200 bg-gray-700 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
        @click="handleCancel">
        ← Back to Review List
      </button>
    </div>

    <!-- Loading state -->
    <SongsLoadingState v-if="isLoading" />

    <!-- Error state -->
    <SongsErrorState v-else-if="hasError" :error="error" @retry="handleRetry" />

    <!-- Song edit form -->
    <div v-else-if="hasSong">
      <SongEditForm :song="song" @save="handleSaveSong" @cancel="handleCancel" />
    </div>

    <!-- No song found -->
    <div v-else class="text-center text-gray-400">
      Song not found.
    </div>
  </div>
</template>