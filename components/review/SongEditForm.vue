<script setup lang="ts">
import type { ApiSong } from "~/types/api";

const props = defineProps<{
  song: ApiSong;
}>();

const emit = defineEmits<{
  save: [song: ApiSong];
  cancel: [];
}>();

// Create a local copy of the song for editing
const editedSong = ref({ ...props.song });

// Track form validation state
const isValid = computed(() => {
  return (
    !!editedSong.value.title &&
    !!editedSong.value.artist &&
    !!editedSong.value.genre
  );
});

// Reset form to original values
function resetForm() {
  editedSong.value = { ...props.song };
}

// Handle save form
function handleSave() {
  if (isValid.value) {
    emit("save", editedSong.value);
  }
}

// Handle cancel
function handleCancel() {
  resetForm();
  emit("cancel");
}

// Current year for date validation
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
    <h3 class="text-xl font-semibold text-yellow-400 mb-4">
      Review Song Information
    </h3>

    <form @submit.prevent="handleSave">
      <!-- Audio preview -->
      <div class="mb-6">
        <h4 class="text-gray-300 text-sm font-medium mb-2">Preview</h4>
        <audio
          :src="`/audio/${song._id.substring(2, 3)}/${song._id}.mp3`"
          controls
          class="w-full"
        ></audio>
      </div>

      <!-- Required fields group -->
      <div class="space-y-4 mb-6 border-b border-gray-700 pb-6">
        <p class="text-yellow-500 text-sm font-medium">Required Fields</p>

        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            id="title"
            v-model="editedSong.title"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <!-- Artist -->
        <div>
          <label
            for="artist"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Artist
          </label>
          <input
            id="artist"
            v-model="editedSong.artist"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <!-- Genre -->
        <div>
          <label
            for="genre"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Genre
          </label>
          <input
            id="genre"
            v-model="editedSong.genre"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <!-- Optional fields group -->
      <div class="space-y-4 mb-6">
        <p class="text-gray-400 text-sm font-medium">Optional Fields</p>

        <!-- Album -->
        <div>
          <label
            for="album"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Album
          </label>
          <input
            id="album"
            v-model="editedSong.album"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <!-- Year -->
        <div>
          <label
            for="year"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Year
          </label>
          <input
            id="year"
            v-model.number="editedSong.date"
            type="number"
            min="1900"
            :max="currentYear"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <!-- Track Number -->
        <div>
          <label
            for="tracknumber"
            class="block text-sm font-medium text-gray-300 mb-1"
          >
            Track Number
          </label>
          <input
            id="tracknumber"
            v-model.number="editedSong.tracknumber"
            type="number"
            min="1"
            max="999"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          :disabled="!isValid"
          :class="{ 'opacity-50 cursor-not-allowed': !isValid }"
        >
          Save & Approve
        </button>
      </div>
    </form>
  </div>
</template>
