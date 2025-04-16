<script setup lang="ts">
import { NuxtLink } from "#components";
import { defineEmits, defineProps } from "vue";

interface Song {
  _id: string;
  title: string;
  artist: string;
  tokenartists: string[];
  album: string;
  duration: number;
}

const props = defineProps<{
  songs: Song[];
  sortField: string;
  sortDirection: string;
  isSongPlaying: (song: Song) => boolean;
  formatDuration: (duration: number) => string;
}>();

const emit = defineEmits<{
  (e: "sort", field: string): void;
  (e: "play", song: Song): void;
}>();

const getSortIndicator = (field: string) => {
  if (field !== props.sortField) return "";
  return props.sortDirection === "asc" ? "↑" : "↓";
};

const handleSortKeyDown = (e: KeyboardEvent, field: string) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    emit("sort", field);
  }
};
</script>

<template>
  <div class="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
    <table class="min-w-full divide-y divide-gray-700">
      <thead class="bg-gray-900">
        <tr>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          ></th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            <button
              class="group flex items-center focus:outline-none focus:text-yellow-400"
              tabindex="0"
              aria-label="Sort by title"
              @click="emit('sort', 'title')"
              @keydown="(e) => handleSortKeyDown(e, 'title')"
            >
              Title {{ getSortIndicator("title") }}
            </button>
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            <button
              class="group flex items-center focus:outline-none focus:text-yellow-400"
              tabindex="0"
              aria-label="Sort by artist"
              @click="emit('sort', 'artist')"
              @keydown="(e) => handleSortKeyDown(e, 'artist')"
            >
              Artist {{ getSortIndicator("artist") }}
            </button>
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            <button
              class="group flex items-center focus:outline-none focus:text-yellow-400"
              tabindex="0"
              aria-label="Sort by album"
              @click="emit('sort', 'album')"
              @keydown="(e) => handleSortKeyDown(e, 'album')"
            >
              Album {{ getSortIndicator("album") }}
            </button>
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
          >
            <button
              class="group flex items-center focus:outline-none focus:text-yellow-400"
              tabindex="0"
              aria-label="Sort by duration"
              @click="emit('sort', 'duration')"
              @keydown="(e) => handleSortKeyDown(e, 'duration')"
            >
              Duration {{ getSortIndicator("duration") }}
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="bg-gray-800 divide-y divide-gray-700">
        <tr
          v-for="song in props.songs"
          :key="song._id"
          :class="{ 'bg-yellow-900/30': props.isSongPlaying(song) }"
          class="hover:bg-gray-700 cursor-pointer transition-colors"
        >
          <td class="px-6 py-4 whitespace-nowrap">
            <button
              class="text-yellow-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-full p-1"
              :aria-label="props.isSongPlaying(song) ? 'Now playing' : 'Play'"
              tabindex="0"
              @click="emit('play', song)"
              @keydown.enter="emit('play', song)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                :class="{ 'text-yellow-400': props.isSongPlaying(song) }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  v-if="props.isSongPlaying(song)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  v-if="!props.isSongPlaying(song)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  v-if="!props.isSongPlaying(song)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200"
            tabindex="0"
            role="button"
            :aria-label="`Play ${song.title}`"
            @click="emit('play', song)"
            @keydown.enter="emit('play', song)"
          >
            {{ song.title }}
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
            @click.stop
          >
            <div
              class="flex flex-wrap gap-1"
              v-if="song.tokenartists && song.tokenartists.length"
            >
              <template
                v-for="(artist, index) in song.tokenartists"
                :key="artist"
              >
                <NuxtLink
                  :to="`/app/artists/${encodeURIComponent(artist)}`"
                  class="text-yellow-400 hover:text-yellow-300 focus:outline-none focus:text-yellow-300"
                  tabindex="0"
                >
                  {{ artist }}
                </NuxtLink>
                <span v-if="index < song.tokenartists.length - 1">, </span>
              </template>
            </div>
            <span
              v-else
              tabindex="0"
              role="button"
              @click="emit('play', song)"
              @keydown.enter="emit('play', song)"
            >
              {{ song.artist }}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
            tabindex="0"
            role="button"
            :aria-label="`Play ${song.title} from album ${song.album}`"
            @click="emit('play', song)"
            @keydown.enter="emit('play', song)"
          >
            {{ song.album }}
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
            tabindex="0"
            role="button"
            :aria-label="`Play ${song.title}, duration: ${props.formatDuration(
              song.duration
            )}`"
            @click="emit('play', song)"
            @keydown.enter="emit('play', song)"
          >
            {{ props.formatDuration(song.duration) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
