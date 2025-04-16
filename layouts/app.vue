<template>
  <div class="flex flex-col min-h-screen bg-gray-900 text-gray-200">
    <!-- Sticky Header with player controls -->
    <header
      class="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-10 border-b border-gray-700"
    >
      <div class="max-w-full px-4">
        <div class="flex justify-between h-14">
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
          <div
            class="flex-1 max-w-2xl mx-auto flex items-center justify-center space-x-4"
          >
            <button
              class="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"
                />
              </svg>
            </button>
            <button
              class="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button
              class="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"
                />
              </svg>
            </button>
          </div>

          <div class="flex items-center">
            <span v-if="user?.username" class="text-gray-400 mr-4">
              Welcome, {{ user.username }}
            </span>
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

        <!-- Progress bar -->
        <div class="w-full h-1 bg-gray-700">
          <div class="h-full bg-yellow-400 w-1/3"></div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 pt-14">
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto px-4 py-6">
        <slot />
      </main>

      <!-- Sticky Side Panel (for playlist) -->
      <aside
        class="w-80 bg-gray-800 border-l border-gray-700 fixed right-0 top-14 bottom-14 overflow-y-auto"
      >
        <div class="p-4">
          <h2 class="text-lg font-medium text-yellow-400">Playlist</h2>
          <p class="text-sm text-gray-400 mt-2">
            Your playlist will appear here
          </p>

          <!-- Sample Playlist -->
          <div class="mt-4 space-y-2">
            <div
              class="flex items-center p-2 rounded-md bg-gray-700 text-white"
            >
              <span class="flex-1 truncate">Currently Playing</span>
              <span class="text-xs text-gray-400">3:29</span>
            </div>
            <div
              v-for="i in 5"
              :key="i"
              class="flex items-center p-2 rounded-md hover:bg-gray-700"
            >
              <span class="flex-1 truncate">Track {{ i }}</span>
              <span class="text-xs text-gray-400"
                >{{ Math.floor(Math.random() * 4) + 1 }}:{{
                  Math.floor(Math.random() * 60)
                    .toString()
                    .padStart(2, "0")
                }}</span
              >
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-gray-400 py-4 border-t border-gray-700">
      <div class="max-w-7xl mx-auto px-4">
        <p class="text-center text-sm">© 2023 tenX Music Player</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Use the auth composable
import { useAuth } from "~/composables/useAuth";
const { logout, user } = useAuth();
</script>
