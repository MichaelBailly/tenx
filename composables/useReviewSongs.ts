import { useRoute, useRouter } from "#app";
import { computed, onMounted, reactive, ref } from "vue";
import type { ApiSong } from "~/types/api";
import type { SongsApiResponse, SongsState } from "~/types/songs";
import { formatDuration } from "../utils/format";

// Create a store for review songs state
const reviewSongsState = reactive<SongsState>({
  songs: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalSongs: 0,
  limit: 20,
  sortField: "ts_creation",
  sortDirection: "desc",
});

// Currently editing song reference
const editingSong = ref<ApiSong | null>(null);

export function useReviewSongs() {
  const route = useRoute();
  const router = useRouter();

  // Get query parameters
  const pageParam = Number(route.query.page) || 1;
  const limitParam = Number(route.query.limit) || 20;
  const sortParam = (route.query.sort as string) || "-ts_creation";

  // Parse sort field and direction
  if (sortParam) {
    if (sortParam.startsWith("-")) {
      reviewSongsState.sortField = sortParam.substring(1);
      reviewSongsState.sortDirection = "desc";
    } else {
      reviewSongsState.sortField = sortParam;
      reviewSongsState.sortDirection = "asc";
    }
  }

  // Set pagination parameters
  reviewSongsState.currentPage = pageParam;
  reviewSongsState.limit = limitParam;

  // Update URL when state changes
  const updateURL = (page: number, limit: number, sort: string) => {
    const query = { ...route.query };

    // Only include parameters that differ from defaults
    if (page === 1) {
      delete query.page;
    } else {
      query.page = page.toString();
    }

    if (limit === 20) {
      delete query.limit;
    } else {
      query.limit = limit.toString();
    }

    if (sort === "-ts_creation") {
      delete query.sort;
    } else {
      query.sort = sort;
    }

    // Replace current URL with new query parameters
    router.replace({ query });
  };

  // Helper to create sort string for API
  const getSortString = () => {
    return reviewSongsState.sortDirection === "desc"
      ? `-${reviewSongsState.sortField}`
      : reviewSongsState.sortField;
  };

  // Fetch songs for review with pagination and sorting
  const fetchReviewSongs = async (
    page = reviewSongsState.currentPage,
    limit = reviewSongsState.limit,
    sort = getSortString()
  ) => {
    reviewSongsState.loading = true;
    reviewSongsState.error = null;

    try {
      // Build query parameters
      const query: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
        sort,
      };

      console.log("Fetching review songs with params:", query);

      // Using $fetch directly instead of useFetch for more direct control
      const url = `/api/v1/review?${new URLSearchParams(query).toString()}`;
      console.log("API URL:", url);

      try {
        // Make the direct fetch call with proper options
        const response = await $fetch<SongsApiResponse>(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        console.log("Raw API response:", response);

        // Process the response data
        if (!response || !response.success || !response.data) {
          console.log("Invalid response format:", response);
          throw new Error(
            response?.error || "Failed to fetch songs: Invalid response format"
          );
        }

        const responseData = response.data;

        // Validate response data shape
        if (!responseData.songs || !responseData.pagination) {
          console.log("Missing required fields in response:", responseData);
          throw new Error(
            "Unexpected API response format: missing required fields"
          );
        }

        // Update state with response data
        reviewSongsState.songs = responseData.songs;
        reviewSongsState.currentPage = responseData.pagination.page;
        reviewSongsState.totalPages = responseData.pagination.pages;
        reviewSongsState.totalSongs = responseData.pagination.total;
        reviewSongsState.limit = responseData.pagination.limit;

        // Update URL to reflect current state
        updateURL(page, limit, sort);

        return responseData.songs;
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      reviewSongsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching songs for review:", error);

      // Set a default value for totalSongs in case of error
      reviewSongsState.totalSongs = 0;
      return [];
    } finally {
      reviewSongsState.loading = false;
    }
  };

  // Change sort field
  const changeSort = (field: string) => {
    if (field === reviewSongsState.sortField) {
      // Toggle direction if field is the same
      reviewSongsState.sortDirection =
        reviewSongsState.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Set new field and reset direction to asc
      reviewSongsState.sortField = field;
      reviewSongsState.sortDirection = "asc";
    }

    const newSortString = getSortString();

    // Refetch songs with new sort and reset to first page
    fetchReviewSongs(1, reviewSongsState.limit, newSortString);
  };

  // Change page
  const changePage = (page: number) => {
    if (page < 1 || page > reviewSongsState.totalPages) return;
    fetchReviewSongs(page, reviewSongsState.limit, getSortString());
  };

  // Change items per page
  const changeLimit = (limit: number) => {
    fetchReviewSongs(1, limit, getSortString());
  };

  // Select a song for editing
  const editSong = (song: ApiSong) => {
    editingSong.value = { ...song };
  };

  // Cancel editing
  const cancelEditing = () => {
    editingSong.value = null;
  };

  // Save edited song metadata
  const saveSong = async (song: ApiSong): Promise<boolean> => {
    try {
      // Call the update API
      const { data, error } = await useFetch<{
        success: boolean;
        error?: string;
      }>(`/api/v1/songs/${song._id}`, {
        method: "PUT",
        body: {
          title: song.title,
          artist: song.artist,
          album: song.album || "",
          genre: song.genre,
          date: song.date,
          tracknumber: song.tracknumber,
          reviewed: true, // Mark as reviewed
        },
      });

      if (error.value) {
        console.error("Error saving song:", error.value);
        return false;
      }

      if (!data.value?.success) {
        console.error("Failed to save song:", data.value?.error);
        return false;
      }

      // Update local song in the songs array
      const index = reviewSongsState.songs.findIndex((s) => s._id === song._id);
      if (index !== -1) {
        reviewSongsState.songs.splice(index, 1);
        reviewSongsState.totalSongs--;

        // Refresh if this was the last song on the page
        if (
          reviewSongsState.songs.length === 0 &&
          reviewSongsState.currentPage > 1
        ) {
          fetchReviewSongs(reviewSongsState.currentPage - 1);
        }
      }

      editingSong.value = null;
      return true;
    } catch (e) {
      console.error("Exception saving song:", e);
      return false;
    }
  };

  // Format duration as mm:ss
  // formatDuration is now imported from utils/format

  // Initial fetch
  onMounted(() => {
    fetchReviewSongs(pageParam, limitParam, sortParam || getSortString());
  });

  return {
    // State
    reviewSongsState,
    editingSong,

    // Computed
    hasSongs: computed(() => reviewSongsState.songs.length > 0),

    // Methods
    fetchReviewSongs,
    changePage,
    changeSort,
    changeLimit,
    formatDuration,
    editSong,
    cancelEditing,
    saveSong,
  };
}
