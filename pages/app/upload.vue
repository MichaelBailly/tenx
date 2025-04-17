<template>
  <div
    class="max-w-xl mx-auto mt-12 p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
  >
    <h2 class="text-2xl font-bold text-yellow-400 mb-6">Upload Audio File</h2>
    <form @submit.prevent="handleUpload" class="space-y-6">
      <div>
        <label for="file" class="block text-sm font-medium text-gray-300 mb-2"
          >Select MP3 file</label
        >
        <input
          id="file"
          type="file"
          accept="audio/mp3,audio/mpeg"
          class="block w-full text-gray-200 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          @change="handleFileChange"
          aria-label="Select MP3 file to upload"
        />
      </div>
      <button
        type="submit"
        class="w-full py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50"
        :disabled="!file || loading"
        aria-label="Upload selected file"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg
            class="animate-spin h-5 w-5 mr-2 text-gray-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          Uploading...
        </span>
        <span v-else>Upload</span>
      </button>
    </form>
    <div v-if="error" class="mt-4 text-red-400" role="alert">{{ error }}</div>
    <div v-if="result" class="mt-4 text-green-400" role="status">
      Upload successful!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const file = ref<File | null>(null);
const error = ref("");
const result = ref(false);
const loading = ref(false);

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
  error.value = "";
  result.value = false;
}

async function handleUpload() {
  error.value = "";
  result.value = false;
  if (!file.value) {
    error.value = "Please select a file.";
    return;
  }
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file.value);
    const res = await fetch("/api/v1/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      error.value = await res.text();
    } else {
      result.value = true;
      // Optionally, redirect to review or library page after a short delay
      // setTimeout(() => router.push('/app/songs'), 1500)
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message;
    } else {
      error.value = "Upload failed.";
    }
  } finally {
    loading.value = false;
  }
}
</script>
