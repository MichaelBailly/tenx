<script setup lang="ts">
// Define props to make the component reusable across different pages
defineProps<{
  activePage: "songs" | "artists" | "albums" | "recent" | "review";
}>();
</script>

<template>
  <div class="mb-4 border-b border-gray-700">
    <div class="flex space-x-4">
      <NuxtLink
        to="/app/songs"
        :class="[
          'pb-2 px-1 font-medium',
          activePage === 'songs'
            ? 'text-yellow-400 border-b-2 border-yellow-400'
            : 'text-gray-400 hover:text-gray-300',
        ]"
      >
        All Songs
      </NuxtLink>
      <NuxtLink
        to="/app/artists"
        :class="[
          'pb-2 px-1 font-medium',
          activePage === 'artists'
            ? 'text-yellow-400 border-b-2 border-yellow-400'
            : 'text-gray-400 hover:text-gray-300',
        ]"
      >
        By Artist
      </NuxtLink>
      <NuxtLink
        to="/app/albums"
        :class="[
          'pb-2 px-1 font-medium',
          activePage === 'albums'
            ? 'text-yellow-400 border-b-2 border-yellow-400'
            : 'text-gray-400 hover:text-gray-300',
        ]"
      >
        By Album
      </NuxtLink>
      <button
        class="text-gray-400 hover:text-gray-300 pb-2 px-1 font-medium"
        :class="{
          'text-yellow-400 border-b-2 border-yellow-400':
            activePage === 'recent',
        }"
      >
        Recent
      </button>
    </div>
  </div>
</template>
