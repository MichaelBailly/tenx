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
            Crossfade Controls
          </h3>
          <div class="flex items-center">
            <button
              @click="close"
              class="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full p-1 flex items-center"
              tabindex="0"
              aria-label="Close crossfade control panel"
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
          <!-- Crossfade toggle -->
          <div class="flex items-center justify-center mb-4 w-full">
            <label class="flex items-center cursor-pointer">
              <div class="relative">
                <input
                  type="checkbox"
                  class="sr-only"
                  :checked="enableCrossfade"
                  @change="toggleCrossfade"
                />
                <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                <div
                  class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform"
                  :class="enableCrossfade ? 'translate-x-6 bg-yellow-400' : ''"
                ></div>
              </div>
              <div class="ml-3 text-gray-200 font-medium">
                {{
                  enableCrossfade ? "Crossfade Enabled" : "Crossfade Disabled"
                }}
              </div>
            </label>
          </div>

          <!-- Only show controls when crossfade is enabled -->
          <div v-if="enableCrossfade" class="w-full">
            <!-- Current duration indicator -->
            <div class="flex items-center justify-center mb-4">
              <span class="text-lg font-bold text-yellow-400">{{
                formattedCrossfadeDuration
              }}</span>
            </div>

            <!-- Duration controls -->
            <div
              class="w-full max-w-xs flex items-center justify-between px-2 mb-3"
            >
              <button
                @click="decreaseDuration"
                @keydown.enter="decreaseDuration"
                @keydown.space.prevent="decreaseDuration"
                class="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform duration-150 hover:scale-105"
                tabindex="0"
                aria-label="Decrease crossfade duration"
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

              <!-- Duration slider (visual only) -->
              <div class="flex-1 mx-4 h-2 bg-gray-700 rounded relative">
                <!-- Dynamic position indicator based on current duration (1-30 seconds) -->
                <div
                  class="absolute top-0 h-full bg-yellow-400 rounded"
                  :style="{ width: `${((crossfadeDuration - 1) / 29) * 100}%` }"
                ></div>
                <div
                  class="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-md"
                  :style="{
                    left: `calc(${
                      ((crossfadeDuration - 1) / 29) * 100
                    }% - 8px)`,
                  }"
                ></div>
              </div>

              <button
                @click="increaseDuration"
                @keydown.enter="increaseDuration"
                @keydown.space.prevent="increaseDuration"
                class="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-transform duration-150 hover:scale-105"
                tabindex="0"
                aria-label="Increase crossfade duration"
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

            <!-- Duration help text -->
            <p class="text-xs text-gray-400 mb-3 text-center">
              Click the (+) button to increase or (-) to decrease crossfade
              duration by 1 second
            </p>

            <!-- Preset durations -->
            <div class="flex flex-wrap justify-center gap-2 mb-2">
              <button
                v-for="duration in presetDurations"
                :key="duration"
                @click="setCrossfadeDuration(duration)"
                @keydown.enter="setCrossfadeDuration(duration)"
                @keydown.space.prevent="setCrossfadeDuration(duration)"
                class="px-3 py-1 text-xs rounded-full transition-colors duration-150"
                :class="[
                  crossfadeDuration === duration
                    ? 'bg-yellow-400 text-gray-900 font-medium'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
                ]"
                tabindex="0"
                :aria-label="`Set crossfade duration to ${duration} seconds`"
              >
                {{ duration }}s
              </button>
            </div>
          </div>

          <!-- Description when disabled -->
          <div v-else class="text-sm text-gray-300 mb-4 text-center">
            When enabled, songs will blend smoothly from one to the next.
            <br />
            This creates a continuous listening experience with no silence
            between tracks.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAudioPlayer } from "~/composables/useAudioPlayer";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// Get all the player functionalities from the composable
const {
  enableCrossfade,
  crossfadeDuration,
  formattedCrossfadeDuration,
  toggleCrossfade,
  setCrossfadeDuration,
} = useAudioPlayer();

// Preset duration options
const presetDurations = [3, 5, 10, 15, 20];

// Increase/decrease duration by 1 second
const increaseDuration = () => {
  setCrossfadeDuration(crossfadeDuration.value + 1);
};

const decreaseDuration = () => {
  setCrossfadeDuration(crossfadeDuration.value - 1);
};

// Close the panel
const close = () => {
  emit("close");
};
</script>

<style scoped>
/* Toggle switch animation */
.dot {
  transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
}
</style>
