<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="albums" />

    <h1 class="text-2xl font-bold text-yellow-400 mb-6">Albums</h1>

    <!-- Loading state -->
    <div v-if="isLoading && !hasAlbums" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"
      />
      <p class="mt-4 text-gray-400">Loading albums...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="hasError"
      class="bg-red-900/30 p-4 rounded-md border border-red-800"
    >
      <p class="text-red-400">{{ albumsState.error }}</p>
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
      v-else-if="!hasAlbums"
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
      <h2 class="mt-4 text-lg font-medium text-yellow-400">No albums found</h2>
      <p class="mt-2 text-sm text-gray-400">
        Upload some music to get started.
      </p>
    </div>

    <!-- Albums grid -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="album in albumsState.albums"
        :key="album.name"
        class="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:bg-gray-700 transition-colors cursor-pointer"
        @click="goToAlbum(album.name)"
      >
        <div class="flex items-start space-x-4">
          <img
            :src="getAlbumImage(album.name)"
            :alt="album.name + ' album cover'"
            class="w-16 h-16 rounded-md object-cover"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-yellow-400 font-medium truncate">
              {{ album.name }}
            </h3>
            <p class="text-gray-400 text-sm mt-1">
              {{ album.songCount }}
              {{ album.songCount === 1 ? "song" : "songs" }}
            </p>
            <p class="text-gray-400 text-sm">
              {{ formatLongDuration(album.totalDuration) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="albumsState.totalPages > 1"
      :current-page="albumsState.currentPage"
      :total-pages="albumsState.totalPages"
      :on-page-change="changePage"
      class="mt-6"
    />

    <!-- Album count and pagination info -->
    <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
      <p>
        Showing {{ albumsState.albums.length }} of
        {{ albumsState.totalAlbums }} albums
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Albums per page:</label>
        <select
          id="limit-select"
          v-model="albumsState.limit"
          class="bg-gray-800 border border-gray-700 rounded text-sm focus:border-yellow-400 focus:ring-yellow-400 text-gray-200"
          @change="handleLimitChange($event)"
        >
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
          <option :value="96">96</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRouter } from "vue-router";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import Pagination from "~/components/ui/Pagination.vue";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

interface Album {
  name: string;
  songCount: number;
  totalDuration: number;
}

interface AlbumsState {
  albums: Album[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalAlbums: number;
  limit: number;
}

interface AlbumsApiResponse {
  success: boolean;
  data?: {
    albums: Album[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  error?: string;
}

const router = useRouter();

// Album image generation
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

const albumImageCache = new Map<string, string>();

const getAlbumImage = (albumName: string) => {
  // If we already assigned an image to this album, return it
  if (albumImageCache.has(albumName)) {
    return albumImageCache.get(albumName);
  }

  // Generate a deterministic but seemingly random color based on album name
  const nameHash = albumName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % vinylColors.length;
  const color = vinylColors[colorIndex];

  const imagePath = `/images/vinyl-${color}.png`;
  albumImageCache.set(albumName, imagePath);

  return imagePath;
};

// Format duration as hh:mm:ss
const formatLongDuration = (seconds: number): string => {
  if (!seconds) return "0:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

// Create state for albums
const albumsState = reactive<AlbumsState>({
  albums: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalAlbums: 0,
  limit: 24,
});

const isLoading = computed(() => albumsState.loading);
const hasError = computed(() => !!albumsState.error);
const hasAlbums = computed(() => albumsState.albums.length > 0);

// Handler for retry button
const handleRetry = () => {
  fetchAlbums();
};

// Handler for limit change
const handleLimitChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newLimit = Number(select.value);
  albumsState.limit = newLimit;
  fetchAlbums();
};

// Navigate to album detail page
const goToAlbum = (albumName: string) => {
  router.push(`/app/albums/${encodeURIComponent(albumName)}`);
};

// Change page
const changePage = (page: number) => {
  if (page < 1 || page > albumsState.totalPages) return;
  albumsState.currentPage = page;
  fetchAlbums();
};

// Fetch albums
const fetchAlbums = async () => {
  albumsState.loading = true;
  albumsState.error = null;

  try {
    const response = await fetch(
      `/api/v1/albums?page=${albumsState.currentPage}&limit=${albumsState.limit}`
    );
    const data: AlbumsApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch albums");
    }

    if (!data.success || !data.data) {
      throw new Error("Unexpected API response format");
    }

    albumsState.albums = data.data.albums;
    albumsState.totalPages = data.data.pagination.pages;
    albumsState.totalAlbums = data.data.pagination.total;
  } catch (error) {
    albumsState.error =
      error instanceof Error ? error.message : "An error occurred";
    console.error("Error fetching albums:", error);
  } finally {
    albumsState.loading = false;
  }
};

// Initial fetch
fetchAlbums();
</script>
