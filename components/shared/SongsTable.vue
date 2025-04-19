<script setup lang="ts">
import { NuxtLink } from "#components";
import { useAudioPlayer } from "~/composables/useAudioPlayer";
import { usePlayerQueue } from "~/composables/usePlayerQueue";
import type { ApiSong } from "~/types/api";

const props = defineProps<{
  songs: ApiSong[];
  sortField: string;
  sortDirection: string;
  formatDuration: (duration: number) => string;
}>();

const emit = defineEmits<{
  (e: "sort", field: string): void;
}>();

// Initialize player queue and audio player composables
const { queueState, addToQueue, insertSongAt, playSongFromQueue } =
  usePlayerQueue();
const { loadSong } = useAudioPlayer();

// Enhanced play button functionality
const handlePlayClick = (song: ApiSong) => {
  const queue = queueState.value.songs;
  const currentIndex = queueState.value.currentSongIndex;

  // Case 1: Queue is empty or player is not playing
  if (queue.length === 0 || currentIndex === -1) {
    // Add song to the beginning of queue and play it
    if (queue.length === 0) {
      addToQueue(song);
      playSongFromQueue(0);

      // Explicitly load and play the song
      if (song.fileUrl || song._id) {
        loadSong(song.fileUrl || song._id);
      }
    } else {
      // Insert at the beginning and play it
      insertSongAt(song, 0);
      playSongFromQueue(0);

      // Explicitly load and play the song
      if (song.fileUrl || song._id) {
        loadSong(song.fileUrl || song._id);
      }
    }
  }
  // Case 2: A song is already playing, add this song just after the current one and play it
  else {
    // Find the song in the queue to avoid duplicates
    const songIndex = queue.findIndex((s) => s._id === song._id);

    if (songIndex !== -1) {
      // Song already exists in queue, just play it
      playSongFromQueue(songIndex);

      // Explicitly load and play the song
      if (song.fileUrl || song._id) {
        loadSong(song.fileUrl || song._id);
      }
    } else {
      // Insert after currently playing song
      insertSongAt(song, currentIndex + 1);
      playSongFromQueue(currentIndex + 1);

      // Explicitly load and play the song
      if (song.fileUrl || song._id) {
        loadSong(song.fileUrl || song._id);
      }
    }
  }
};

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

// Handle drag start event for songs (to drag to player queue)
const handleDragStart = (e: DragEvent, song: ApiSong) => {
  if (e.dataTransfer) {
    // Convert the song object to JSON string and set as data
    e.dataTransfer.setData("application/json", JSON.stringify(song));
    e.dataTransfer.effectAllowed = "copy";
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
          class="hover:bg-gray-700 cursor-pointer transition-colors"
          draggable="true"
          @dragstart="(e) => handleDragStart(e, song)"
        >
          <td class="px-6 py-4 whitespace-nowrap">
            <button
              class="text-yellow-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-full p-1"
              tabindex="0"
              @click="handlePlayClick(song)"
              @keydown.enter="handlePlayClick(song)"
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
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
            <span v-else tabindex="0">
              {{ song.artist }}
            </span>
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
            tabindex="0"
          >
            {{ song.album }}
          </td>
          <td
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
            tabindex="0"
          >
            {{ props.formatDuration(song.duration) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
