<script setup lang="ts">
import { computed } from "vue";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import Pagination from "~/components/ui/Pagination.vue";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

const {
  artistsState,
  changePage,
  changeSort,
  changeLimit,
  formatLongDuration,
} = await useArtistList();

const isLoading = computed(() => artistsState.loading);
const hasError = computed(() => !!artistsState.error);
const hasArtists = computed(() => artistsState.artists.length > 0);

// Method to get sort indicator for the column
const getSortIndicator = (field: string) => {
  if (field !== artistsState.sortField) return "";
  return artistsState.sortDirection === "asc" ? "↑" : "↓";
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
  changePage(1);
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
    <SongsNavigation active-page="artists" />

    <h1 class="text-2xl font-bold text-yellow-400 mb-6">Artists</h1>

    <!-- Loading state -->
    <div v-if="isLoading && !hasArtists" class="text-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"
      />
      <p class="mt-4 text-gray-400">Loading artists...</p>
    </div>

    <!-- Error state -->
    <div
      v-else-if="hasError"
      class="bg-red-900/30 p-4 rounded-md border border-red-800"
    >
      <p class="text-red-400">{{ artistsState.error }}</p>
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
      v-else-if="!hasArtists"
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
        No artists in your library
      </h2>
      <p class="mt-2 text-sm text-gray-400">
        Upload some music to get started.
      </p>
    </div>

    <!-- Artists table -->
    <div
      v-else
      class="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700"
    >
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-900">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:text-yellow-400"
                tabindex="0"
                aria-label="Sort by artist name"
                @click="changeSort('_id')"
                @keydown="(e) => handleSortKeyDown(e, '_id')"
              >
                Artist {{ getSortIndicator("_id") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:text-yellow-400"
                tabindex="0"
                aria-label="Sort by song count"
                @click="changeSort('count')"
                @keydown="(e) => handleSortKeyDown(e, 'count')"
              >
                Songs {{ getSortIndicator("count") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:text-yellow-400"
                tabindex="0"
                aria-label="Sort by total duration"
                @click="changeSort('duration')"
                @keydown="(e) => handleSortKeyDown(e, 'duration')"
              >
                Duration {{ getSortIndicator("duration") }}
              </button>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              <button
                class="group flex items-center focus:outline-none focus:text-yellow-400"
                tabindex="0"
                aria-label="Sort by play count"
                @click="changeSort('hits')"
                @keydown="(e) => handleSortKeyDown(e, 'hits')"
              >
                Plays {{ getSortIndicator("hits") }}
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
          <tr
            v-for="artist in artistsState.artists"
            :key="artist._id"
            class="hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200"
              tabindex="0"
              role="button"
              :aria-label="`View songs by ${artist._id}`"
            >
              <NuxtLink
                :to="`/app/artists/${encodeURIComponent(artist._id)}`"
                class="text-gray-200 hover:text-yellow-400 focus:text-yellow-400 focus:outline-none"
              >
                {{ artist._id }}
              </NuxtLink>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
              tabindex="0"
              role="button"
              :aria-label="`${artist.count} songs by ${artist._id}`"
            >
              <NuxtLink
                :to="`/app/artists/${encodeURIComponent(artist._id)}`"
                class="text-gray-400 hover:text-yellow-400 focus:text-yellow-400 focus:outline-none"
              >
                {{ artist.count }}
              </NuxtLink>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
              tabindex="0"
              role="button"
              :aria-label="`Total duration: ${formatLongDuration(
                artist.duration
              )}`"
            >
              <NuxtLink
                :to="`/app/artists/${encodeURIComponent(artist._id)}`"
                class="text-gray-400 hover:text-yellow-400 focus:text-yellow-400 focus:outline-none"
              >
                {{ formatLongDuration(artist.duration) }}
              </NuxtLink>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
              tabindex="0"
              role="button"
              :aria-label="`Played ${artist.hits} times`"
            >
              <NuxtLink
                :to="`/app/artists/${encodeURIComponent(artist._id)}`"
                class="text-gray-400 hover:text-yellow-400 focus:text-yellow-400 focus:outline-none"
              >
                {{ artist.hits }}
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <Pagination
      v-if="artistsState.totalPages > 1"
      :current-page="artistsState.currentPage"
      :total-pages="artistsState.totalPages"
      :on-page-change="changePage"
    />

    <!-- Artist count and pagination info -->
    <div class="mt-4 text-sm text-gray-400 flex justify-between items-center">
      <p>
        Showing {{ artistsState.artists.length }} of
        {{ artistsState.totalArtists }} artists
      </p>
      <div class="flex items-center">
        <label for="limit-select" class="mr-2">Artists per page:</label>
        <select
          id="limit-select"
          v-model="artistsState.limit"
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
