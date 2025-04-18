<script setup lang="ts">
import { computed } from "vue";
import SongSearch from "~/components/shared/SongSearch.vue";
import SongsEmptyState from "~/components/shared/SongsEmptyState.vue";
import SongsErrorState from "~/components/shared/SongsErrorState.vue";
import SongsLoadingState from "~/components/shared/SongsLoadingState.vue";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import SongsTable from "~/components/shared/SongsTable.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { usePlayerQueue } from "~/composables/usePlayerQueue";
import { useSongs } from "~/composables/useSongs";
import type { ApiSong } from "~/types/api";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

const {
  songsState,
  fetchSongs,
  changePage,
  changeSort,
  changeLimit,
  formatDuration,
  searchTerm,
  changeSearch,
} = await useSongs();

const { addToQueue, playSongFromQueue, queueState } = usePlayerQueue();

const isLoading = computed(() => songsState.loading);
const hasError = computed(() => !!songsState.error);
const hasSongs = computed(() => songsState.songs.length > 0);

// Handler for retry button
const handleRetry = () => {
  fetchSongs();
};

// Handler for limit change
const handleLimitChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newLimit = Number(select.value);
  changeLimit(newLimit);
};

// Handler for play button
const handlePlay = (song: ApiSong) => {
  // Add song to queue if not already there
  addToQueue(song);

  // Find the song in the queue and play it
  const songIndex = queueState.songs.findIndex((s) => s._id === song._id);
  if (songIndex !== -1) {
    playSongFromQueue(songIndex);
  }
};
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="songs" />

    <!-- Title and Search with icon toggling search input -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-yellow-400">My Songs</h1>
      <SongSearch
        :model-value="searchTerm"
        @update:model-value="changeSearch"
      />
    </div>

    <!-- Loading state -->
    <SongsLoadingState v-if="isLoading && !hasSongs" />

    <!-- Error state -->
    <SongsErrorState
      v-else-if="hasError"
      :error="songsState.error"
      @retry="handleRetry"
    />

    <!-- Empty state -->
    <SongsEmptyState v-else-if="!hasSongs" />

    <!-- Songs table -->
    <SongsTable
      v-else
      :songs="songsState.songs"
      :sort-field="songsState.sortField"
      :sort-direction="songsState.sortDirection"
      :format-duration="formatDuration"
      @sort="changeSort"
      @play="handlePlay"
    />

    <!-- Pagination -->
    <Pagination
      v-if="songsState.totalPages > 1"
      :current-page="songsState.currentPage"
      :total-pages="songsState.totalPages"
      :on-page-change="changePage"
    />

    <!-- Song count and pagination info -->
    <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
      <p>
        Showing {{ songsState.songs.length }} of
        {{ songsState.totalSongs }} songs
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Songs per page:</label>
        <select
          id="limit-select"
          v-model="songsState.limit"
          class="bg-gray-800 border border-gray-700 rounded text-sm focus:border-yellow-400 focus:ring-yellow-400 text-gray-200"
          @change="handleLimitChange($event)"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>
