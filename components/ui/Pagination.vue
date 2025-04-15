<script setup lang="ts">
const props = defineProps<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}>();

type PageItem = number | string;

const getPageNumbers = (): PageItem[] => {
  const pages: PageItem[] = [];
  const maxVisiblePages = 5;

  if (props.totalPages <= maxVisiblePages) {
    // Show all pages if there are fewer than maxVisiblePages
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always include first page
    pages.push(1);

    // Calculate start and end of the middle section
    let start = Math.max(2, props.currentPage - 1);
    let end = Math.min(props.totalPages - 1, props.currentPage + 1);

    // Adjust if we're at the beginning
    if (props.currentPage <= 3) {
      end = Math.min(props.totalPages - 1, maxVisiblePages - 1);
    }

    // Adjust if we're at the end
    if (props.currentPage >= props.totalPages - 2) {
      start = Math.max(2, props.totalPages - (maxVisiblePages - 2));
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push("...");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if needed
    if (end < props.totalPages - 1) {
      pages.push("...");
    }

    // Always include last page
    pages.push(props.totalPages);
  }

  return pages;
};
</script>

<template>
  <nav aria-label="Pagination" class="flex justify-center mt-6">
    <ul class="flex list-none">
      <!-- Previous page button -->
      <li>
        <button
          @click="onPageChange(currentPage - 1)"
          @keydown.enter="onPageChange(currentPage - 1)"
          class="px-3 py-1 mx-1 rounded border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          tabindex="0"
        >
          &laquo;
        </button>
      </li>

      <!-- Page numbers -->
      <li v-for="(page, index) in getPageNumbers()" :key="index">
        <button
          v-if="page !== '...'"
          @click="onPageChange(Number(page))"
          @keydown.enter="onPageChange(Number(page))"
          class="px-3 py-1 mx-1 rounded border text-sm font-medium"
          :class="
            currentPage === page
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          "
          :aria-current="currentPage === page ? 'page' : undefined"
          tabindex="0"
        >
          {{ page }}
        </button>
        <span v-else class="px-3 py-1 mx-1 text-sm text-gray-700">...</span>
      </li>

      <!-- Next page button -->
      <li>
        <button
          @click="onPageChange(currentPage + 1)"
          @keydown.enter="onPageChange(currentPage + 1)"
          class="px-3 py-1 mx-1 rounded border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages || totalPages === 0"
          aria-label="Next page"
          tabindex="0"
        >
          &raquo;
        </button>
      </li>
    </ul>
  </nav>
</template>
