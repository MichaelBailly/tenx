import { useFetch } from "#app";
import { computed, reactive, ref } from "vue";
import type { ApiSong } from "~/types/api";
import type { ApiError } from "~/types/common";
import type { SongsApiResponse, SongsState } from "~/types/songs";

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

      // Use Nuxt's useFetch to call the review API
      const { data, error } = await useFetch<SongsApiResponse>(
        "/api/v1/review",
        {
          method: "GET",
          params: query,
        }
      );

      // Handle error response
      if (error.value) {
        const errorData = error.value.data as ApiError;

        // Handle the specific case of page out of range
        if (
          errorData?.code === "PAGE_OUT_OF_RANGE" &&
          errorData?.data?.totalPages
        ) {
          console.warn(
            `Page ${page} is out of range. Redirecting to last page ${errorData.data.totalPages}`
          );

          // Update state with the last available page
          reviewSongsState.totalPages = errorData.data.totalPages;
          reviewSongsState.totalSongs = errorData.data.totalSongs || 0;

          // Redirect to the last available page
          return fetchReviewSongs(errorData.data.totalPages, limit, sort);
        }

        throw new Error(
          errorData?.error || `Failed to fetch songs: ${error.value.message}`
        );
      }

      // Make sure we have data
      if (!data.value?.success || !data.value.data) {
        throw new Error(data.value?.error || "Failed to fetch songs");
      }

      const responseData = data.value.data;

      // Validate response data shape
      if (!responseData.songs || !responseData.pagination) {
        throw new Error("Unexpected API response format");
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
    } catch (error) {
      reviewSongsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching songs for review:", error);
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
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

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
