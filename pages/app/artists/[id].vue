<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Pagination from "~/components/ui/Pagination.vue";

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
  playSong,
  formatDuration,
  isSongPlaying,
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
    songs.sort((a, b) => a.tracknumber - b.tracknumber);
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

// Method to get sort indicator for the column
const getSortIndicator = (field: string) => {
  if (field !== artistSongsState.sortField) return "";
  return artistSongsState.sortDirection === "asc" ? "↑" : "↓";
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
      const queryParams = {};
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
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <div class="mb-4 border-b border-gray-700">
      <div class="flex space-x-4">
        <NuxtLink
          to="/app/songs"
          class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium"
        >
          All Songs
        </NuxtLink>
        <NuxtLink
          to="/app/artists"
          class="text-yellow-400 border-b-2 border-yellow-400 pb-2 px-1 font-medium"
        >
          By Artist
        </NuxtLink>
        <button class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium">
          By Album
        </button>
        <button class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium">
          Recent
        </button>
      </div>
    </div>

    <!-- Back button and Artist Name -->
    <div class="flex items-center mb-6">
      <button
        class="text-yellow-400 hover:text-yellow-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
        @click="goBackToArtists"
        title="Back to Artists"
        aria-label="Back to Artists"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-yellow-400 ml-2">
        {{ artistId }}
      </h1>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !hasSongs" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"
      />
      <p class="mt-4 text-gray-400">Loading songs...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="hasError"
      class="bg-red-900/30 p-4 rounded-md border border-red-800"
    >
      <p class="text-red-400">{{ artistSongsState.error }}</p>
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
        No songs found for {{ artistId }}
      </h2>
      <p class="mt-2 text-sm text-gray-400">
        The artist might have been removed or renamed.
      </p>
    </div>

    <!-- Songs table -->
    <div
      v-else
      class="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700"
    >
      <!-- Album sections -->
      <div v-for="album in songsByAlbum" :key="album.name" class="mb-6">
        <!-- Album header with image -->
        <div
          class="flex items-center bg-gray-900 px-6 py-4 border-t border-gray-700"
        >
          <div class="flex-shrink-0 mr-4">
            <img
              :src="album.imagePath"
              :alt="`${album.name} album cover`"
              class="h-16 w-16 rounded-md object-cover shadow-md"
              loading="lazy"
            />
          </div>
          <h2 class="text-lg font-medium text-yellow-400">{{ album.name }}</h2>
        </div>

        <!-- Album songs -->
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-900/50">
            <tr>
              <th
                scope="col"
                class="w-12 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                <!-- Play button column -->
              </th>
              <th
                v-if="album.name !== 'No Album'"
                scope="col"
                class="w-16 px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                #
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                <button
                  class="group flex items-center focus:outline-none focus:text-yellow-400"
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
                class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                <button
                  class="group flex items-center focus:outline-none focus:text-yellow-400"
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
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr
              v-for="song in album.songs"
              :key="song._id"
              :class="{ 'bg-yellow-900/30': isSongPlaying(song) }"
              class="hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  class="text-yellow-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-full p-1"
                  :aria-label="isSongPlaying(song) ? 'Now playing' : 'Play'"
                  tabindex="0"
                  @click="playSong(song)"
                  @keydown.enter="playSong(song)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    :class="{ 'text-yellow-400': isSongPlaying(song) }"
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
                v-if="album.name !== 'No Album'"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
              >
                {{ song.tracknumber || "-" }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200"
                tabindex="0"
                role="button"
                :aria-label="`Play ${song.title}`"
                @click="playSong(song)"
                @keydown.enter="playSong(song)"
              >
                {{ song.title }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
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
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="artistSongsState.totalPages > 1"
      :current-page="artistSongsState.currentPage"
      :total-pages="artistSongsState.totalPages"
      :on-page-change="changePage"
    />

    <!-- Song count and pagination info -->
    <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
      <p>
        Showing {{ artistSongsState.songs.length }} of
        {{ artistSongsState.totalSongs }} songs by {{ artistId }}
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Songs per page:</label>
        <select
          id="limit-select"
          v-model="artistSongsState.limit"
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
