<script setup lang="ts">
import { ref } from "vue";
import { useAudioPlayer } from "~/composables/useAudioPlayer";
import { usePlayerQueue } from "~/composables/usePlayerQueue";
import type { ApiSong } from "~/types/api";

// Use the updated composable which now uses the Pinia store
const {
  queueState,
  clearQueue,
  playSongFromQueue,
  formatDuration,
  removeFromQueue,
  moveSongInQueue,
  addToQueue,
} = usePlayerQueue();

const { stop } = useAudioPlayer();

// Drag-and-drop state
const draggedSongIndex = ref<number | null>(null);
const dragOverSongIndex = ref<number | null>(null);
const isDraggingOver = ref(false);
const dropPosition = ref<"before" | "after">("before");

// Handle dragstart for a song in the queue
const handleDragStart = (index: number) => {
  draggedSongIndex.value = index;
};

// Handle dragend event
const handleDragEnd = () => {
  draggedSongIndex.value = null;
  dragOverSongIndex.value = null;
  isDraggingOver.value = false;
  dropPosition.value = "before";
};

// Handle dragover event for a song in the queue
const handleDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (draggedSongIndex.value !== null && draggedSongIndex.value !== index) {
    dragOverSongIndex.value = index;

    // Determine if drop should be before or after based on mouse position
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      dropPosition.value = e.clientY < midpoint ? "before" : "after";
    }
  }
};

// Handle drop event to reorder songs
const handleDrop = (e: DragEvent, toIndex: number) => {
  e.preventDefault();
  if (draggedSongIndex.value !== null && draggedSongIndex.value !== toIndex) {
    // Get the song being dragged
    const fromIndex = draggedSongIndex.value;

    // Calculate the final target index
    let finalToIndex = toIndex;

    // If dropping after, increment the target index
    if (dropPosition.value === "after") {
      finalToIndex++;
    }

    // If we're moving an item from before the target to after it,
    // we need to adjust because removing the item will shift indexes
    if (fromIndex < finalToIndex) {
      finalToIndex--;
    }

    // Move it in the queue using the store action via composable
    moveSongInQueue(fromIndex, finalToIndex);

    // Reset drag state
    draggedSongIndex.value = null;
    dragOverSongIndex.value = null;
    dropPosition.value = "before";
  }
};

// Handle dragover event for the queue area
const handleQueueDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDraggingOver.value = true;

  // If we're dragging from SongsTable (not within queue)
  if (draggedSongIndex.value === null) {
    // Find the closest song item to determine insertion point
    const songElements = document.querySelectorAll(".queue-song-item");

    if (songElements.length > 0) {
      // Find the song item closest to the cursor
      let closestIndex = -1;
      let closestDistance = Infinity;
      let positionIsAfter = false;

      songElements.forEach((element, index) => {
        if (element instanceof HTMLElement) {
          const rect = element.getBoundingClientRect();
          const elementMiddleY = rect.top + rect.height / 2;
          const distance = Math.abs(e.clientY - elementMiddleY);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
            positionIsAfter = e.clientY > elementMiddleY;
          }
        }
      });

      if (closestIndex !== -1) {
        dragOverSongIndex.value = closestIndex;
        dropPosition.value = positionIsAfter ? "after" : "before";
      }
    }
  }
};

// Handle dragleave event for the queue area
const handleQueueDragLeave = () => {
  isDraggingOver.value = false;
};

// Handle drop event for the queue area (for songs dragged from SongsTable)
const handleQueueDrop = (e: DragEvent) => {
  e.preventDefault();
  isDraggingOver.value = false;

  // Check if something was dropped from SongsTable
  const songData = e.dataTransfer?.getData("application/json");
  if (songData) {
    try {
      const song = JSON.parse(songData) as ApiSong;

      // If dropping on an existing song, determine the insert position
      if (dragOverSongIndex.value !== null) {
        // Insert at the appropriate position based on dropPosition
        let insertIndex = dragOverSongIndex.value;

        if (dropPosition.value === "after") {
          insertIndex++;
        }

        // Use the Pinia store action to insert song at specific position
        const { insertSongAt } = usePlayerQueue();
        insertSongAt(song, insertIndex);
      } else {
        // Default: add to the end of queue
        addToQueue(song);
      }
    } catch (err) {
      console.error("Error adding song to queue:", err);
    }
  }

  // Reset states
  dragOverSongIndex.value = null;
  dropPosition.value = "before";
};

// Handle clicking the clear queue button
const handleClearQueue = () => {
  clearQueue();
  stop();
};

// Handle clicking the play button for a song
const handlePlaySong = (index: number) => {
  playSongFromQueue(index);
};

// Handle removing a song from the queue
const handleRemoveSong = (songId: string, index: number) => {
  // Use the removeFromQueue action from the store via composable
  removeFromQueue(songId, index);
};
</script>

<template>
  <!-- The template remains unchanged since we're using the same queueState structure -->
  <div
    class="p-4 h-full"
    @dragover="handleQueueDragOver"
    @dragleave="handleQueueDragLeave"
    @drop="handleQueueDrop"
  >
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-yellow-400">Player Queue</h2>
      <button
        class="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        tabindex="0"
        aria-label="Clear queue"
        @click="handleClearQueue"
      >
        Clear Queue
      </button>
    </div>

    <!-- Drop area for new songs when empty -->
    <div
      v-if="queueState.songs.length === 0"
      class="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center"
      :class="{ 'bg-gray-700/30 border-yellow-400': isDraggingOver }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-10 w-10 text-gray-500"
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
      <p class="text-sm text-gray-400 mt-2">
        Drag songs here to add them to the queue
      </p>
    </div>

    <!-- Queue with songs -->
    <div v-else class="space-y-2">
      <div
        v-for="(song, index) in queueState.songs"
        :key="`${song._id}-${index}`"
        class="flex items-center p-2 rounded-md transition-all relative queue-song-item"
        :class="[
          index === queueState.currentSongIndex
            ? 'bg-gray-700 text-white'
            : 'hover:bg-gray-700',
        ]"
        draggable="true"
        @dragstart="handleDragStart(index)"
        @dragend="handleDragEnd"
        @dragover="(e) => handleDragOver(e, index)"
        @drop="(e) => handleDrop(e, index)"
      >
        <!-- Visual indicator for drop position -->
        <div
          v-if="dragOverSongIndex === index"
          class="absolute left-0 right-0 h-1 bg-yellow-400 rounded-full"
          :class="dropPosition === 'before' ? '-top-0.5' : '-bottom-0.5'"
        ></div>

        <!-- Play indicator or play button -->
        <button
          class="flex-shrink-0 mr-2 text-yellow-400 hover:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full p-1"
          tabindex="0"
          aria-label="Play song"
          @click="handlePlaySong(index)"
        >
          <svg
            v-if="index === queueState.currentSongIndex"
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
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

        <!-- Song info -->
        <div class="flex-1 truncate">
          <div class="text-sm font-medium truncate">{{ song.title }}</div>
          <div class="text-xs text-gray-400 truncate">{{ song.artist }}</div>
        </div>

        <!-- Duration -->
        <span class="text-xs text-gray-400 mx-2">{{
          formatDuration(song.duration)
        }}</span>

        <!-- Remove button (only for songs that aren't playing) -->
        <button
          v-if="index !== queueState.currentSongIndex"
          class="text-gray-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 rounded p-1"
          tabindex="0"
          aria-label="Remove song from queue"
          @click="handleRemoveSong(song._id, index)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
