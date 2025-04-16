<script setup lang="ts">
import { ref, nextTick } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "close"): void;
}>();

const searchActive = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const showSearch = () => {
  searchActive.value = true;
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus();
    }
  });
};

const clearSearch = () => {
  emit("update:modelValue", "");
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus();
    }
  });
};

const closeSearch = () => {
  searchActive.value = false;
  emit("update:modelValue", "");
  emit("close");
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && searchActive.value) {
    closeSearch();
  }
};
</script>

<template>
  <div class="relative flex items-center h-10">
    <!-- Search icon button (visible when search is not active) -->
    <div
      @mouseover="showSearch"
      class="relative h-10 flex items-center"
      v-if="!searchActive"
    >
      <button
        class="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        aria-label="Open search"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z"
          />
        </svg>
      </button>
    </div>

    <!-- Search input with animation (appears when search is active) -->
    <transition
      enter-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="opacity-0 w-10"
      enter-to-class="opacity-100 w-64"
      leave-active-class="transition-all duration-300 ease-in-out"
      leave-from-class="opacity-100 w-64"
      leave-to-class="opacity-0 w-10"
    >
      <div v-if="searchActive" class="relative flex items-center h-10">
        <input
          id="song-search"
          type="text"
          :value="props.modelValue"
          @input="
            emit('update:modelValue', ($event.target as HTMLInputElement).value)
          "
          autocomplete="off"
          placeholder="Search by title, artist, or album..."
          class="pl-4 pr-10 py-2 rounded-full bg-gray-900 border border-gray-700 text-gray-200 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 w-64 h-10"
          aria-label="Search songs"
          @keydown="handleKeyDown"
          @blur="!props.modelValue && closeSearch()"
          ref="searchInput"
        />
        <button
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 focus:outline-none"
          aria-label="Clear search"
          tabindex="0"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>
