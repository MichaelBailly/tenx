<template>
  <div
    class="flex-1 max-w-2xl mx-auto flex flex-col items-center justify-center w-full px-4"
  >
    <!-- Song info -->
    <div v-if="currentSong" class="w-full text-center mb-1 truncate">
      <div class="text-xs font-medium text-white truncate">
        {{ currentSong.title }}
      </div>
      <div class="text-xs text-gray-400 truncate">
        {{ currentSong.artist }}
      </div>
    </div>
    <div v-else class="w-full text-center mb-1 text-xs text-gray-400">
      <div class="text-xs font-medium text-white truncate">&nbsp;</div>
      <div class="text-xs text-gray-400 truncate">&nbsp;</div>
    </div>

    <!-- Controls and progress bar -->
    <div class="w-full">
      <!-- Time indicators with progress bar -->
      <div class="flex items-center space-x-2 mb-1">
        <!-- Current time -->
        <span class="text-xs text-gray-400 w-10 text-right">{{
          formattedCurrentTime
        }}</span>

        <!-- Progress bar -->
        <div
          class="relative flex-1 h-2 bg-gray-700 rounded cursor-pointer group"
          @click="handleProgressBarClick"
          @mousemove="handleProgressBarHover"
          @mouseleave="handleProgressBarLeave"
          ref="progressBarRef"
        >
          <!-- Progress indicator -->
          <div
            class="absolute top-0 left-0 h-full bg-yellow-400 rounded"
            :style="{ width: `${progressPercentage}%` }"
          ></div>

          <!-- Hover position indicator -->
          <div
            v-if="seekPosition !== null"
            class="absolute top-0 h-full bg-yellow-200 opacity-30 rounded"
            :style="{ left: `${hoverPercentage}%`, width: '2px' }"
          ></div>

          <!-- Time tooltip on hover -->
          <div
            v-if="formattedSeekPosition"
            class="absolute bottom-full mb-1 px-1 py-0.5 bg-gray-800 text-xs text-white rounded transform -translate-x-1/2"
            :style="{ left: `${hoverPercentage}%` }"
          >
            {{ formattedSeekPosition }}
          </div>

          <!-- Loading indicator -->
          <div
            v-if="isLoading"
            class="absolute top-0 left-0 h-full w-full overflow-hidden"
          >
            <div
              class="h-full w-full bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-shimmer"
            ></div>
          </div>
        </div>

        <!-- Total duration -->
        <span class="text-xs text-gray-400 w-10">{{ formattedDuration }}</span>
      </div>

      <!-- Playback controls -->
      <div
        class="flex items-center justify-center space-x-4 -translate-y-[5px]"
      >
        <!-- Previous button -->
        <button
          class="text-gray-300 hover:text-white p-0 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          @click="playPrevious"
          tabindex="0"
          aria-label="Previous song"
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

        <!-- Play/Pause button -->
        <button
          class="text-gray-300 hover:text-white p-0 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform duration-150 hover:scale-120"
          @click="togglePlay"
          tabindex="0"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
        >
          <svg
            v-if="isPlaying"
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
          <svg
            v-else
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

        <!-- Next button -->
        <button
          class="text-gray-300 hover:text-white p-0 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          @click="playNext"
          tabindex="0"
          aria-label="Next song"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAudioPlayer } from "~/composables/useAudioPlayer";

// Get all the player functionalities from the composable
const {
  isPlaying,
  isLoading,
  formattedCurrentTime,
  formattedDuration,
  progressPercentage,
  seekPosition,
  formattedSeekPosition,
  currentSong,
  togglePlay,
  playNext,
  playPrevious,
  seekByPercentage,
  updateSeekPosition,
} = useAudioPlayer();

// Reference to the progress bar element for click positioning
const progressBarRef = ref<HTMLDivElement | null>(null);
const hoverPercentage = ref(0);

// Handle click on the progress bar to seek
const handleProgressBarClick = (event: MouseEvent) => {
  if (!progressBarRef.value) return;

  const rect = progressBarRef.value.getBoundingClientRect();
  const clickPosition = event.clientX - rect.left;
  const percentage = (clickPosition / rect.width) * 100;

  seekByPercentage(percentage);
};

// Handle hover on the progress bar to show time indicator
const handleProgressBarHover = (event: MouseEvent) => {
  if (!progressBarRef.value) return;

  const rect = progressBarRef.value.getBoundingClientRect();
  const hoverPosition = event.clientX - rect.left;
  const percentage = (hoverPosition / rect.width) * 100;

  hoverPercentage.value = Math.max(0, Math.min(100, percentage));
  updateSeekPosition(percentage);
};

// Handle mouse leave event to hide time indicator
const handleProgressBarLeave = () => {
  updateSeekPosition(null);
};
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
</style>
