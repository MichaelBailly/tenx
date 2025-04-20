<template>
  <div
    class="fixed top-20 left-0 right-0 z-20 transition-all duration-300"
    :class="[
      isOpen
        ? 'translate-y-0 opacity-100'
        : '-translate-y-full opacity-0 pointer-events-none',
    ]"
  >
    <div
      class="mx-auto max-w-lg bg-gray-800 rounded-b-lg shadow-lg border border-gray-700 border-t-0 overflow-hidden"
    >
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-yellow-400">
            Playback Speed Controls
          </h3>
          <div class="flex items-center">
            <button
              @click="close"
              class="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full p-1 flex items-center"
              tabindex="0"
              aria-label="Close speed control panel"
            >
              <span class="text-xs mr-1">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col items-center">
          <!-- Current speed indicator -->
          <div class="flex items-center justify-center mb-4">
            <span class="text-lg font-bold text-yellow-400">{{
              formattedPlaybackSpeed
            }}</span>
          </div>

          <!-- Speed controls with attractive design -->
          <div
            class="w-full max-w-xs flex items-center justify-between px-2 mb-3"
          >
            <button
              @click="decreasePlaybackSpeed"
              @keydown.enter="decreasePlaybackSpeed"
              @keydown.space.prevent="decreasePlaybackSpeed"
              class="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform duration-150 hover:scale-105"
              tabindex="0"
              aria-label="Decrease playback speed"
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
                  d="M20 12H4"
                />
              </svg>
            </button>

            <!-- Speed slider (visual only) -->
            <div class="flex-1 mx-4 h-2 bg-gray-700 rounded relative">
              <!-- Dynamic position indicator based on current speed (0.5 to 2.0) -->
              <div
                class="absolute top-0 h-full bg-yellow-400 rounded"
                :style="{ width: `${((playbackSpeed - 0.5) / 1.5) * 100}%` }"
              ></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-md"
                :style="{
                  left: `calc(${((playbackSpeed - 0.5) / 1.5) * 100}% - 8px)`,
                }"
              ></div>
            </div>

            <button
              @click="increasePlaybackSpeed"
              @keydown.enter="increasePlaybackSpeed"
              @keydown.space.prevent="increasePlaybackSpeed"
              class="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform duration-150 hover:scale-105"
              tabindex="0"
              aria-label="Increase playback speed"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <!-- Speed help text -->
          <p class="text-xs text-gray-400 mb-3">
            Click the (+) button to increase or (-) to decrease speed by 5%
          </p>

          <!-- Preset speeds -->
          <div class="flex flex-wrap justify-center gap-2 mb-2">
            <button
              v-for="speed in presetSpeeds"
              :key="speed"
              @click="setPlaybackSpeed(speed)"
              @keydown.enter="setPlaybackSpeed(speed)"
              @keydown.space.prevent="setPlaybackSpeed(speed)"
              class="px-3 py-1 text-xs rounded-full transition-colors duration-150"
              :class="[
                Math.abs(playbackSpeed - speed) < 0.01
                  ? 'bg-yellow-400 text-gray-900 font-medium'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
              ]"
              tabindex="0"
              :aria-label="`Set playback speed to ${speed}x`"
            >
              {{ speed }}x
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAudioPlayer } from "~/composables/useAudioPlayer";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// Get all the player functionalities from the composable
const {
  playbackSpeed,
  formattedPlaybackSpeed,
  increasePlaybackSpeed,
  decreasePlaybackSpeed,
  setPlaybackSpeed,
} = useAudioPlayer();

// Preset speed options
const presetSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

// Close the panel
const close = () => {
  emit("close");
};
</script>
