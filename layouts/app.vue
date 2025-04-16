<template>
  <div class="flex flex-col min-h-screen">
    <!-- Sticky Header -->
    <header class="fixed top-0 left-0 right-0 bg-white shadow z-10">
      <div class="max-w-full px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-gray-900">tenX</h1>

            <!-- Main Navigation -->
            <nav class="flex space-x-4">
              <NuxtLink
                to="/app/songs"
                class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                active-class="text-indigo-600 bg-indigo-50"
              >
                Songs
              </NuxtLink>
            </nav>
          </div>
          <div class="flex items-center">
            <span v-if="user?.username" class="text-gray-600 mr-4">
              Welcome, {{ user.username }}
            </span>
            <button
              class="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

    <div class="flex flex-1 pt-16">
      <!-- pt-16 to account for fixed header height -->
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
      </main>

      <!-- Sticky Side Panel (for playlist) -->
      <aside
        class="w-80 bg-gray-50 border-l border-gray-200 fixed right-0 top-16 bottom-16 overflow-y-auto"
      >
        <!-- Playlist will go here -->
        <div class="p-4">
          <h2 class="text-lg font-medium text-gray-900">Playlist</h2>
          <p class="text-sm text-gray-500 mt-2">
            Your playlist will appear here
          </p>
        </div>
      </aside>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-center">© 2023 tenX Music Player</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Use the auth composable
import { useAuth } from "~/composables/useAuth";
const { logout, user } = useAuth();
</script>
