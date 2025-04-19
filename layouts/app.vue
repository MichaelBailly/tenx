<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-gray-200">
    <!-- Sticky Header with player controls -->
    <header
      class="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-10 border-b border-gray-700 h-20 truncate"
    >
      <div class="max-w-full px-4">
        <div class="flex justify-between h-20">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-yellow-400">tenX</h1>

            <!-- Main Navigation -->
            <nav class="flex space-x-4">
              <NuxtLink
                to="/app/songs"
                class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                active-class="text-yellow-400 bg-gray-700"
              >
                Songs
              </NuxtLink>
            </nav>
          </div>

          <!-- Audio Player Controls -->
          <AudioPlayer />

          <div class="flex items-center">
            <NuxtLink
              to="/app/upload"
              class="ml-4 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 relative"
              aria-label="Upload a new song"
              tabindex="0"
            >
              Upload
              <span
                v-if="reviewSongsState.totalSongs > 0"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {{
                  reviewSongsState.totalSongs > 9
                    ? "9+"
                    : reviewSongsState.totalSongs
                }}
              </span>
            </NuxtLink>
            <button
              class="ml-4 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              aria-label="Log out"
              tabindex="0"
              @click="logout"
              @keydown.enter="logout"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 pt-14">
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto px-4 py-6 mr-80">
        <slot />
      </main>

      <!-- Sticky Side Panel (for playlist) -->
      <aside
        class="w-80 bg-gray-800 border-l border-gray-700 fixed right-0 top-20 bottom-0 overflow-y-auto"
      >
        <PlayerQueue />
      </aside>
    </div>

    <!-- Footer -->
    <footer
      class="bg-gray-800 text-gray-400 py-4 border-t border-gray-700 mr-80"
    >
      <div class="max-w-7xl mx-auto px-4">
        <p class="text-center text-sm">© 2023 tenX Music Player</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
// Use the auth composable
import { useAuth } from "~/composables/useAuth";
// Use the review songs composable
import { useReviewSongs } from "~/composables/useReviewSongs";
// Import the PlayerQueue component
import PlayerQueue from "~/components/player/PlayerQueue.vue";
// Import the AudioPlayer component
import AudioPlayer from "~/components/player/AudioPlayer.vue";

const { logout } = useAuth();
const { reviewSongsState, fetchReviewSongs } = useReviewSongs();

// Set up a periodic refresh of the review songs count (every 5 minutes)
let refreshInterval: number | undefined;

onMounted(() => {
  refreshInterval = window.setInterval(() => {
    fetchReviewSongs().catch((error) => {
      console.error("Failed to refresh review songs count:", error);
    });
  }, 5 * 60 * 1000); // 5 minutes
});

// Clean up the interval when component is unmounted
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>
