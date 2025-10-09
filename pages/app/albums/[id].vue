<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="albums" />

    <!-- Back button and Album Name -->
    <div class="flex items-center mb-6">
      <button
        class="text-yellow-400 hover:text-yellow-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="Back to Albums" aria-label="Back to Albums" @click="goBackToAlbums">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="ml-4 flex items-center">
        <img :src="albumImagePath" :alt="albumId + ' album cover'"
          class="h-16 w-16 rounded-md object-cover shadow-md mr-4" />
        <div>
          <h1 class="text-2xl font-bold text-yellow-400">
            {{ albumId }}
          </h1>
          <p class="text-gray-400 mt-1">
            Total Duration:
            {{ formatLongDuration(albumSongsState.totalDuration) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasSongs" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
      <p class="mt-4 text-gray-400">Loading songs...</p>
    </div>
    <div v-else-if="hasError" class="bg-red-900/30 p-4 rounded-md border border-red-800">
      <p class="text-red-400">{{ albumSongsState.error }}</p>
      <button
        class="mt-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        tabindex="0" aria-label="Try again" @click="handleRetry" @keydown.enter="handleRetry">
        Try Again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasSongs" class="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <h2 class="mt-4 text-lg font-medium text-yellow-400">
        No songs found in this album
      </h2>
      <p class="mt-2 text-sm text-gray-400">
        The album might have been removed or renamed.
      </p>
    </div>

    <!-- Songs table -->
    <div v-else>
      <SongsTable :songs="albumSongsState.songs" :sort-field="albumSongsState.sortField"
        :sort-direction="albumSongsState.sortDirection" :format-duration="formatDuration" @sort="changeSort"
        @edit="handleEditSong" />

      <!-- Song count info -->
      <div class="mt-4 text-sm text-gray-400">
        <p>{{ albumSongsState.songs.length }} songs</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import SongsTable from "~/components/shared/SongsTable.vue";
import { useAlbumSongs } from "~/composables/useAlbumSongs";
import type { ApiSong } from "~/types/api";

// Define page meta to use our app layout
definePageMeta({ layout: "app" });

const router = useRouter();

// Await the composable initialization
const {
  albumSongsState,
  fetchAlbumSongs,
  changeSort,
  formatDuration,
  formatLongDuration,
} = await useAlbumSongs();

const isLoading = computed(() => albumSongsState.loading);
const hasError = computed(() => !!albumSongsState.error);
const hasSongs = computed(() => albumSongsState.songs.length > 0);

// Get album ID from route
const albumId = computed(() =>
  decodeURIComponent(router.currentRoute.value.params.id as string)
);

// Generate album image path
const vinylColors = [
  "blue",
  "green",
  "orange",
  "pink",
  "red",
  "turquoise",
  "violet",
  "white",
  "yellow",
];

// Get a deterministic but seemingly random color based on album name
const albumImagePath = computed(() => {
  const nameHash = albumId.value
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % vinylColors.length;
  const color = vinylColors[colorIndex];
  return `/images/vinyl-${color}.png`;
});

// Handler for retry button
const handleRetry = () => {
  fetchAlbumSongs(albumId.value);
};

// Go back to albums list
const goBackToAlbums = () => {
  router.push("/app/albums");
};

// Handle edit song navigation
const handleEditSong = (song: ApiSong) => {
  navigateTo(`/app/review/${song._id}`);
};

// Fetch album songs when component mounts
fetchAlbumSongs(albumId.value);
</script>
