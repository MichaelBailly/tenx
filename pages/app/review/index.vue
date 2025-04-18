<script setup lang="ts">
import { computed } from "vue";
import ReviewEmptyState from "~/components/review/ReviewEmptyState.vue";
import SongEditForm from "~/components/review/SongEditForm.vue";
import SongsErrorState from "~/components/shared/SongsErrorState.vue";
import SongsLoadingState from "~/components/shared/SongsLoadingState.vue";
import SongsNavigation from "~/components/shared/SongsNavigation.vue";
import Pagination from "~/components/ui/Pagination.vue";
import { useReviewSongs } from "~/composables/useReviewSongs";
import type { ApiSong } from "~/types/api";

// Define page meta to use our app layout
definePageMeta({
  layout: "app",
});

const {
  reviewSongsState,
  editingSong,
  fetchReviewSongs,
  changePage,
  changeSort,
  changeLimit,
  formatDuration,
  editSong,
  cancelEditing,
  saveSong,
} = useReviewSongs();

const isLoading = computed(() => reviewSongsState.loading);
const hasError = computed(() => !!reviewSongsState.error);
const hasSongs = computed(() => reviewSongsState.songs.length > 0);

// Handler for retry button
const handleRetry = () => {
  fetchReviewSongs();
};

// Handler for limit change
const handleLimitChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newLimit = Number(select.value);
  changeLimit(newLimit);
};

// Handle save for song edit form
const handleSaveSong = async (song: ApiSong) => {
  const success = await saveSong(song);
  if (success) {
    // Show a success notification
    const notification = useNuxtApp().$notify?.success || console.log;
    notification("Song updated and approved successfully");
  } else {
    // Show an error notification
    const notification = useNuxtApp().$notify?.error || console.error;
    notification("Failed to update song");
  }
};
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <SongsNavigation active-page="review" />

    <!-- Title area -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-yellow-400">Review Songs</h1>
    </div>

    <div v-if="editingSong" class="mb-6">
      <SongEditForm
        :song="editingSong"
        @save="handleSaveSong"
        @cancel="cancelEditing"
      />
    </div>
    <div v-else>
      <!-- Loading state -->
      <SongsLoadingState v-if="isLoading && !hasSongs" />

      <!-- Error state -->
      <SongsErrorState
        v-else-if="hasError"
        :error="reviewSongsState.error"
        @retry="handleRetry"
      />

      <!-- Empty state -->
      <ReviewEmptyState v-else-if="!hasSongs" />

      <!-- Songs table -->
      <div v-else>
        <div
          class="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700"
        >
          <table class="min-w-full divide-y divide-gray-700">
            <thead class="bg-gray-900">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Actions
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
                  >
                    Title
                    {{
                      reviewSongsState.sortField === "title"
                        ? reviewSongsState.sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""
                    }}
                  </button>
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  <button
                    class="group flex items-center focus:outline-none focus:text-yellow-400"
                    tabindex="0"
                    aria-label="Sort by artist"
                    @click="changeSort('artist')"
                  >
                    Artist
                    {{
                      reviewSongsState.sortField === "artist"
                        ? reviewSongsState.sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""
                    }}
                  </button>
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  <button
                    class="group flex items-center focus:outline-none focus:text-yellow-400"
                    tabindex="0"
                    aria-label="Sort by uploaded date"
                    @click="changeSort('ts_creation')"
                  >
                    Uploaded
                    {{
                      reviewSongsState.sortField === "ts_creation"
                        ? reviewSongsState.sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""
                    }}
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
                  >
                    Duration
                    {{
                      reviewSongsState.sortField === "duration"
                        ? reviewSongsState.sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""
                    }}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              <tr
                v-for="song in reviewSongsState.songs"
                :key="song._id"
                class="hover:bg-gray-700 transition-colors"
              >
                <!-- Actions column -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    class="text-yellow-400 hover:text-yellow-300 bg-gray-700 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    @click="editSong(song)"
                  >
                    Review
                  </button>
                </td>

                <!-- Title column -->
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200"
                >
                  {{ song.title || "Untitled" }}
                </td>

                <!-- Artist column -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ song.artist || "Unknown Artist" }}
                </td>

                <!-- Upload date column -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ new Date(song.ts_creation).toLocaleDateString() }}
                </td>

                <!-- Duration column -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ formatDuration(song.duration) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="reviewSongsState.totalPages > 1"
          :current-page="reviewSongsState.currentPage"
          :total-pages="reviewSongsState.totalPages"
          :on-page-change="changePage"
        />

        <!-- Song count and pagination info -->
        <div
          class="mt-4 text-sm text-gray-400 flex justify-between items-center"
        >
          <p>
            Showing {{ reviewSongsState.songs.length }} of
            {{ reviewSongsState.totalSongs }} songs to review
          </p>
          <div class="flex items-center">
            <label for="limit-select" class="mr-2">Songs per page:</label>
            <select
              id="limit-select"
              v-model="reviewSongsState.limit"
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
    </div>
  </div>
</template>
