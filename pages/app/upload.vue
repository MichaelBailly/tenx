<template>
  <div
    class="max-w-xl mx-auto mt-12 p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700"
  >
    <h2 class="text-2xl font-bold text-yellow-400 mb-6">Upload Audio Files</h2>

    <!-- Review notification banner -->
    <div
      v-if="reviewSongsState.totalSongs > 0"
      class="mb-6 p-4 bg-gray-700 border-l-4 border-yellow-400 rounded-md"
    >
      <div class="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-yellow-400 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-gray-200">
          You have <strong>{{ reviewSongsState.totalSongs }}</strong> song{{
            reviewSongsState.totalSongs !== 1 ? "s" : ""
          }}
          waiting for review
        </span>
      </div>
      <div class="mt-2">
        <NuxtLink
          to="/app/review"
          class="text-yellow-400 hover:text-yellow-300 inline-flex items-center"
        >
          Go to review page
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <!-- Drag & Drop Zone -->
    <div
      class="mb-6 border-2 border-dashed rounded-lg p-6"
      :class="[
        isDragging
          ? 'border-yellow-400 bg-yellow-400/10'
          : 'border-gray-600 hover:border-gray-500',
      ]"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="flex flex-col items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-gray-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="text-lg font-medium text-gray-300 mb-1">
          Drag & drop MP3 files here
        </p>
        <p class="text-sm text-gray-400 mb-4">or</p>
        <label
          for="fileInput"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-yellow-400"
          tabindex="0"
          @keydown.enter="triggerFileInput"
          @keydown.space="triggerFileInput"
        >
          Select files
          <input
            id="fileInput"
            type="file"
            accept="audio/mp3,audio/mpeg"
            class="hidden"
            @change="handleFileChange"
            multiple
            aria-label="Select MP3 files to upload"
          />
        </label>
      </div>
    </div>

    <!-- Upload Queue -->
    <div v-if="fileQueue.length > 0" class="mb-6">
      <h3 class="text-lg font-medium text-gray-300 mb-3">
        Upload Queue ({{ fileQueue.length }} files)
      </h3>

      <div class="space-y-3">
        <div
          v-for="item in fileQueue"
          :key="item.id"
          class="bg-gray-700 rounded-md p-3 border border-gray-600"
        >
          <div class="flex justify-between items-center mb-2">
            <span
              class="text-gray-200 font-medium truncate max-w-[85%]"
              :title="item.file.name"
            >
              {{ item.file.name }}
            </span>
            <span class="text-xs text-gray-400">
              {{ formatFileSize(item.file.size) }}
            </span>
          </div>

          <!-- Status display -->
          <div class="flex items-center">
            <!-- Loading spinner for uploading status -->
            <span
              v-if="item.status === 'uploading'"
              class="flex items-center text-yellow-400 text-sm"
            >
              <svg
                class="animate-spin h-4 w-4 mr-2"
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

            <!-- Success icon -->
            <span
              v-else-if="item.status === 'success'"
              class="flex items-center text-green-400 text-sm"
            >
              <svg
                class="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              Upload successful
            </span>

            <!-- Warning icon for duplicates -->
            <span
              v-else-if="item.status === 'warning'"
              class="flex items-center text-amber-400 text-sm"
            >
              <svg
                class="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-10a1 1 0 10-2 0v4a1 1 0 102 0V8zm0 7a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ item.error }}
            </span>

            <!-- Error icon -->
            <span
              v-else-if="item.status === 'error'"
              class="flex items-center text-red-400 text-sm"
            >
              <svg
                class="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Error: {{ item.error }}
            </span>

            <!-- Queued status -->
            <span v-else class="flex items-center text-gray-400 text-sm">
              <svg
                class="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
              Queued
            </span>

            <!-- Remove button for non-uploading files -->
            <button
              v-if="item.status !== 'uploading'"
              @click="removeFileFromQueue(item.id)"
              class="ml-auto text-gray-400 hover:text-red-400 focus:outline-none"
              aria-label="Remove file from queue"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useReviewSongs } from "~/composables/useReviewSongs";

interface QueueItem {
  id: string;
  file: File;
  status: "queued" | "uploading" | "success" | "error" | "warning";
  error?: string;
}

const isDragging = ref(false);
const fileQueue = ref<QueueItem[]>([]);
const activeUploads = ref(0);
const MAX_CONCURRENT_UPLOADS = 2;
const processingQueue = ref(false);

// Get review songs state
const { reviewSongsState, fetchReviewSongs } = useReviewSongs();

// Fetch review songs on mount
onMounted(() => {
  fetchReviewSongs();
});

// Only watch for new files being added to the queue
watch(
  () => fileQueue.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && !processingQueue.value) {
      // Only process queue when new files are added and we're not already processing
      processQueue();
    }
  }
);

function triggerFileInput() {
  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}

function handleDragOver() {
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;

  if (!e.dataTransfer?.files) {
    return;
  }

  addFilesToQueue(
    [...e.dataTransfer.files].filter(
      (file) => file.type === "audio/mp3" || file.type === "audio/mpeg"
    )
  );
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;

  if (!target.files?.length) {
    return;
  }

  addFilesToQueue([...target.files]);

  // Reset the file input so the same file can be selected again if needed
  target.value = "";
}

function addFilesToQueue(files: File[]) {
  if (!files.length) {
    return;
  }

  const newItems: QueueItem[] = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    status: "queued",
  }));

  fileQueue.value = [...fileQueue.value, ...newItems];
}

function removeFileFromQueue(id: string) {
  fileQueue.value = fileQueue.value.filter((item) => item.id !== id);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}

// Process the upload queue with a max of 2 concurrent uploads
async function processQueue() {
  // Check if we're already processing or if there are no more slots available
  if (processingQueue.value || activeUploads.value >= MAX_CONCURRENT_UPLOADS) {
    return;
  }

  // Set processing flag to true to prevent multiple simultaneous invocations
  processingQueue.value = true;

  try {
    // Find files to upload (only queued status)
    const filesToUpload = fileQueue.value.filter(
      (item) => item.status === "queued"
    );

    if (filesToUpload.length === 0) {
      return;
    }

    // Calculate how many more uploads we can start
    const availableSlots = MAX_CONCURRENT_UPLOADS - activeUploads.value;
    const filesToProcess = filesToUpload.slice(0, availableSlots);

    // Start uploads for available slots
    const uploadPromises = filesToProcess.map((item) => uploadFile(item));

    // Wait for these uploads to complete before processing more
    await Promise.all(uploadPromises);
  } finally {
    // Reset processing flag
    processingQueue.value = false;

    // Check if there are more files to process
    if (activeUploads.value < MAX_CONCURRENT_UPLOADS) {
      // Use setTimeout to avoid potential call stack issues
      setTimeout(() => processQueue(), 0);
    }
  }
}

async function uploadFile(item: QueueItem): Promise<void> {
  // Update status to uploading and increment active uploads counter
  fileQueue.value = fileQueue.value.map((f) =>
    f.id === item.id ? { ...f, status: "uploading", error: undefined } : f
  );
  activeUploads.value++;

  try {
    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("filename", item.file.name); // Send original filename

    const res = await fetch("/api/v1/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();

      // Special handling for duplicate song error (specific message)
      if (res.status === 400 && errorText.includes("duplicate SHA1")) {
        // Clean the error message
        const errorMessage = "A song with this file already exists";

        // Update status to warning - these files won't be automatically retried
        fileQueue.value = fileQueue.value.map((f) =>
          f.id === item.id
            ? { ...f, status: "warning", error: errorMessage }
            : f
        );
      } else {
        throw new Error(errorText || "Upload failed");
      }
    } else {
      // Update status to success
      fileQueue.value = fileQueue.value.map((f) =>
        f.id === item.id ? { ...f, status: "success" } : f
      );

      // Refresh review songs count after successful upload
      fetchReviewSongs();
    }
  } catch (e: unknown) {
    // Update status to error with error message
    const errorMessage = e instanceof Error ? e.message : "Upload failed.";
    fileQueue.value = fileQueue.value.map((f) =>
      f.id === item.id ? { ...f, status: "error", error: errorMessage } : f
    );
  } finally {
    // Decrement active uploads counter
    activeUploads.value--;

    // Since a slot has opened up, process more files if available
    if (!processingQueue.value) {
      processQueue();
    }
  }
}
</script>
