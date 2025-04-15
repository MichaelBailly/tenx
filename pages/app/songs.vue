<script setup lang="ts">
import { computed } from "vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useSongs } from "~/composables/useSongs";

const {
  songsState,
  fetchSongs,
  changePage,
  changeSort,
  changeLimit,
  playSong,
  formatDuration,
  isSongPlaying,
} = await useSongs();

const isLoading = computed(() => songsState.loading);
const hasError = computed(() => !!songsState.error);
const hasSongs = computed(() => songsState.songs.length > 0);

// Method to get sort indicator for the column
const getSortIndicator = (field: string) => {
  if (field !== songsState.sortField) return "";
  return songsState.sortDirection === "asc" ? "↑" : "↓";
};

// Helper for accessible sort button
const handleSortKeyDown = (e: KeyboardEvent, field: string) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    changeSort(field);
  }
};

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
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">My Songs</h1>

    <!-- Loading state -->
    <div v-if="isLoading && !hasSongs" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      />
      <p class="mt-4 text-gray-600">Loading your songs...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="bg-red-50 p-4 rounded-md">
      <p class="text-red-600">{{ songsState.error }}</p>
      <button
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        tabindex="0"
        aria-label="Try again"
        @click="handleRetry"
        @keydown.enter="handleRetry"
      >
        Try Again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasSongs" class="text-center py-12 bg-gray-50 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-16 w-16 text-gray-400 mx-auto"
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
      <h2 class="mt-4 text-lg font-medium text-gray-900">
        No songs in your library
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Upload some music to get started.
      </p>
    </div>

    <!-- Songs table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <!-- Empty header for the play button column -->
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:underline"
                tabindex="0"
                aria-label="Sort by title"
                @click="changeSort('title')"
                @keydown="(e) => handleSortKeyDown(e, 'title')"
              >
                Title {{ getSortIndicator("title") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:underline"
                tabindex="0"
                aria-label="Sort by artist"
                @click="changeSort('artist')"
                @keydown="(e) => handleSortKeyDown(e, 'artist')"
              >
                Artist {{ getSortIndicator("artist") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:underline"
                tabindex="0"
                aria-label="Sort by album"
                @click="changeSort('album')"
                @keydown="(e) => handleSortKeyDown(e, 'album')"
              >
                Album {{ getSortIndicator("album") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:underline"
                tabindex="0"
                aria-label="Sort by duration"
                @click="changeSort('duration')"
                @keydown="(e) => handleSortKeyDown(e, 'duration')"
              >
                Duration {{ getSortIndicator("duration") }}
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="song in songsState.songs"
            :key="song._id"
            :class="{ 'bg-indigo-50': isSongPlaying(song) }"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <button
                class="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
                :aria-label="isSongPlaying(song) ? 'Now playing' : 'Play'"
                tabindex="0"
                @click="playSong(song)"
                @keydown.enter="playSong(song)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  :class="{ 'text-indigo-600': isSongPlaying(song) }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    v-if="isSongPlaying(song)"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    v-if="!isSongPlaying(song)"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    v-if="!isSongPlaying(song)"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              tabindex="0"
              role="button"
              :aria-label="`Play ${song.title}`"
              @click="playSong(song)"
              @keydown.enter="playSong(song)"
            >
              {{ song.title }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              tabindex="0"
              role="button"
              :aria-label="`Play ${song.title} by ${song.artist}`"
              @click="playSong(song)"
              @keydown.enter="playSong(song)"
            >
              {{ song.artist }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              tabindex="0"
              role="button"
              :aria-label="`Play ${song.title} from album ${song.album}`"
              @click="playSong(song)"
              @keydown.enter="playSong(song)"
            >
              {{ song.album }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              tabindex="0"
              role="button"
              :aria-label="`Play ${song.title}, duration: ${formatDuration(
                song.duration
              )}`"
              @click="playSong(song)"
              @keydown.enter="playSong(song)"
            >
              {{ formatDuration(song.duration) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="songsState.totalPages > 1"
      :current-page="songsState.currentPage"
      :total-pages="songsState.totalPages"
      :on-page-change="changePage"
    />

    <!-- Song count and pagination info -->
    <div class="mt-4 text-sm text-gray-500 flex justify-between items-center">
      <p>
        Showing {{ songsState.songs.length }} of
        {{ songsState.totalSongs }} songs
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Songs per page:</label>
        <select
          id="limit-select"
          v-model="songsState.limit"
          class="rounded border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
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
