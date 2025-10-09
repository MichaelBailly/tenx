<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import SongsTable from "~/components/shared/SongsTable.vue";
import Pagination from "~/components/ui/Pagination.vue";
import type { ApiSong } from "~/types/api";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

const router = useRouter();

const {
  artistSongsState,
  artistId,
  fetchArtistSongs,
  changePage,
  changeSort,
  changeLimit,
  formatDuration,
} = await useArtistSongs();

const isLoading = computed(() => artistSongsState.loading);
const hasError = computed(() => !!artistSongsState.error);
const hasSongs = computed(() => artistSongsState.songs.length > 0);

// Available vinyl images
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

// Album image cache to ensure each album consistently gets the same image
const albumImageCache = ref(new Map());

// Function to get a random vinyl image for an album
const getAlbumImage = (albumName: string) => {
  // If we already assigned an image to this album, return it
  if (albumImageCache.value.has(albumName)) {
    return albumImageCache.value.get(albumName);
  }

  // Generate a deterministic but seemingly random color based on album name
  const nameHash = albumName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % vinylColors.length;
  const color = vinylColors[colorIndex];

  const imagePath = `/images/vinyl-${color}.png`;
  albumImageCache.value.set(albumName, imagePath);

  return imagePath;
};

// Group songs by album
const songsByAlbum = computed(() => {
  // Create a map to hold songs grouped by album
  const albumMap = new Map();

  // Special group for songs without album
  const noAlbumSongs = [];

  // Sort and group all songs
  for (const song of artistSongsState.songs) {
    if (!song.album) {
      noAlbumSongs.push(song);
      continue;
    }

    if (!albumMap.has(song.album)) {
      albumMap.set(song.album, []);
    }

    albumMap.get(song.album).push(song);
  }

  // Sort each album's songs by track number
  for (const [_album, songs] of albumMap.entries()) {
    songs.sort((a: ApiSong, b: ApiSong) => a.tracknumber - b.tracknumber);
  }

  // Sort no album songs by title
  noAlbumSongs.sort((a, b) => a.title.localeCompare(b.title));

  // Convert the map to an array of album objects
  const result = Array.from(albumMap.entries()).map(([name, songs]) => ({
    name,
    songs,
    imagePath: getAlbumImage(name),
  }));

  // Sort albums alphabetically
  result.sort((a, b) => a.name.localeCompare(b.name));

  // Add no album songs at the beginning if there are any
  if (noAlbumSongs.length > 0) {
    result.unshift({
      name: "No Album",
      songs: noAlbumSongs,
      imagePath: getAlbumImage("No Album"),
    });
  }

  return result;
});

// Handler for retry button
const handleRetry = () => {
  fetchArtistSongs(artistId.value);
};

// Handler for limit change
const handleLimitChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newLimit = Number(select.value);
  changeLimit(newLimit);
};

// Go back to artists list
const goBackToArtists = () => {
  // Check if there's a back URL in the history state
  const historyState = window.history.state;

  if (
    historyState &&
    historyState.back &&
    historyState.back.includes("/app/artists")
  ) {
    // Extract query parameters from the back URL if present
    const backUrl = historyState.back;
    const queryParamsMatch = backUrl.match(/\?(.+)$/);

    if (queryParamsMatch) {
      // Parse the query parameters from the URL
      const queryParams: Record<string, string> = {};
      const searchParams = new URLSearchParams(queryParamsMatch[1]);

      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = value;
      }

      // Navigate back with the extracted query parameters
      router.push({
        path: "/app/artists",
        query: queryParams,
      });
      return;
    }
  }

  // Fallback to simple navigation if no query params were found
  router.push("/app/artists");
};

// Handle edit song navigation
const handleEditSong = (song: ApiSong) => {
  navigateTo(`/app/review/${song._id}`);
};
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="artists" />

    <!-- Back button and Artist Name -->
    <div class="flex items-center mb-6">
      <button
        class="text-yellow-400 hover:text-yellow-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="Back to Artists" aria-label="Back to Artists" @click="goBackToArtists">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-yellow-400 ml-2">
        {{ artistId }}
      </h1>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasSongs" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto" />
      <p class="mt-4 text-gray-400">Loading songs...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="hasError" class="bg-red-900/30 p-4 rounded-md border border-red-800">
      <p class="text-red-400">{{ artistSongsState.error }}</p>
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
        No songs found for {{ artistId }}
      </h2>
      <p class="mt-2 text-sm text-gray-400">
        The artist might have been removed or renamed.
      </p>
    </div>

    <!-- Songs table -->
    <div v-else class="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
      <!-- Album sections -->
      <div v-for="album in songsByAlbum" :key="album.name" class="mb-6">
        <!-- Album header with image -->
        <div class="flex items-center bg-gray-900 px-6 py-4 border-t border-gray-700">
          <div class="flex-shrink-0 mr-4">
            <img :src="album.imagePath" :alt="`${album.name} album cover`"
              class="h-16 w-16 rounded-md object-cover shadow-md" loading="lazy" />
          </div>
          <h2 class="text-lg font-medium text-yellow-400">{{ album.name }}</h2>
        </div>

        <!-- Album songs -->
        <SongsTable :songs="album.songs" :sortField="artistSongsState.sortField"
          :sortDirection="artistSongsState.sortDirection" :formatDuration="formatDuration" @sort="changeSort"
          @edit="handleEditSong" />
      </div>
    </div>

    <!-- Pagination -->
    <Pagination v-if="artistSongsState.totalPages > 1" :current-page="artistSongsState.currentPage"
      :total-pages="artistSongsState.totalPages" :on-page-change="changePage" />

    <!-- Song count and pagination info -->
    <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
      <p>
        Showing {{ artistSongsState.songs.length }} of
        {{ artistSongsState.totalSongs }} songs by {{ artistId }}
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Songs per page:</label>
        <select id="limit-select" v-model="artistSongsState.limit"
          class="bg-gray-800 border border-gray-700 rounded text-sm focus:border-yellow-400 focus:ring-yellow-400 text-gray-200"
          @change="handleLimitChange($event)">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>
