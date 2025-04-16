<script setup lang="ts">
import { computed } from "vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useSongs } from "~/composables/useSongs";
import SongSearch from "~/components/shared/SongSearch.vue";
import SongsTable from "~/components/shared/SongsTable.vue";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";

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
  playSong,
  formatDuration,
  isSongPlaying,
  searchTerm,
  changeSearch,
} = await useSongs();

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
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation />

    <!-- Title and Search with icon toggling search input -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-yellow-400">My Songs</h1>
      <SongSearch :model-value="searchTerm" @update:modelValue="changeSearch" />
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasSongs" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"
      />
      <p class="mt-4 text-gray-400">Loading your songs...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="hasError"
      class="bg-red-900/30 p-4 rounded-md border border-red-800"
    >
      <p class="text-red-400">{{ songsState.error }}</p>
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

    <!-- Empty state -->
    <div
      v-else-if="!hasSongs"
      class="text-center py-12 bg-gray-800 rounded-lg border border-gray-700"
    >
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

    <!-- Songs table -->
    <SongsTable
      v-else
      :songs="songsState.songs"
      :sort-field="songsState.sortField"
      :sort-direction="songsState.sortDirection"
      :is-song-playing="isSongPlaying"
      :format-duration="formatDuration"
      @sort="changeSort"
      @play="playSong"
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
