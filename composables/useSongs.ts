import { useFetch } from "#app";
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ApiSong } from "~/types/api";

// Types
interface SongsState {
  songs: ApiSong[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalSongs: number;
  limit: number;
  sortField: string;
  sortDirection: "asc" | "desc";
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SongsApiResponse {
  success: boolean;
  error?: string;
  data?: {
    songs: ApiSong[];
    pagination: Pagination;
  };
}

interface ApiError {
  code?: string;
  data?: {
    totalPages?: number;
    totalSongs?: number;
  };
  error?: string;
}

// Create a global store for songs state
const songsState = reactive<SongsState>({
  songs: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalSongs: 0,
  limit: 20,
  sortField: "title",
  sortDirection: "asc",
});

// Currently playing song reference
const currentlyPlaying = ref<ApiSong | null>(null);

export async function useSongs() {
  const route = useRoute();
  const router = useRouter();

  if (import.meta.server) {
    console.log("on server, useSongs starts");
  }

  // Initialize state from URL params
  if (import.meta.server) {
    console.log("on server, useSongs onMounted() starts");
  } else {
    console.log("on client, useSongs onMounted() starts");
  }

  // Get query parameters
  const pageParam = Number(route.query.page) || 1;
  const limitParam = Number(route.query.limit) || 20;
  const sortParam = (route.query.sort as string) || "title";

  // Parse sort field and direction
  if (sortParam) {
    if (sortParam.startsWith("-")) {
      songsState.sortField = sortParam.substring(1);
      songsState.sortDirection = "desc";
    } else {
      songsState.sortField = sortParam;
      songsState.sortDirection = "asc";
    }
  }

  // Set pagination parameters
  songsState.currentPage = pageParam;
  songsState.limit = limitParam;

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

    if (sort === "title") {
      delete query.sort;
    } else {
      query.sort = sort;
    }

    // Replace current URL with new query parameters
    router.replace({ query });
  };

  // Fetch songs with pagination and sorting
  const fetchSongs = async (
    page = songsState.currentPage,
    limit = songsState.limit,
    sort = getSortString()
  ) => {
    songsState.loading = true;
    songsState.error = null;

    try {
      // Build query parameters
      const query = {
        page: page.toString(),
        limit: limit.toString(),
        sort,
      };

      // Use Nuxt's useFetch instead of native fetch
      const { data, error } = await useFetch<SongsApiResponse>(
        "/api/v1/songs",
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
          songsState.totalPages = errorData.data.totalPages;
          songsState.totalSongs = errorData.data.totalSongs || 0;

          // Redirect to the last available page
          return fetchSongs(errorData.data.totalPages, limit, sort);
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
      songsState.songs = responseData.songs;
      songsState.currentPage = responseData.pagination.page;
      songsState.totalPages = responseData.pagination.pages;
      songsState.totalSongs = responseData.pagination.total;
      songsState.limit = responseData.pagination.limit;

      // Update URL to reflect current state
      updateURL(page, limit, sort);

      return responseData.songs;
    } catch (error) {
      songsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching songs:", error);
      return [];
    } finally {
      songsState.loading = false;
    }
  };

  // Change sort field
  const changeSort = (field: string) => {
    if (field === songsState.sortField) {
      // Toggle direction if field is the same
      songsState.sortDirection =
        songsState.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Set new field and reset direction to asc
      songsState.sortField = field;
      songsState.sortDirection = "asc";
    }

    const newSortString = getSortString();

    // Refetch songs with new sort and reset to first page
    fetchSongs(1, songsState.limit, newSortString);
  };

  // Helper to create sort string for API
  const getSortString = () => {
    return songsState.sortDirection === "desc"
      ? `-${songsState.sortField}`
      : songsState.sortField;
  };

  // Change page
  const changePage = (page: number) => {
    if (page < 1 || page > songsState.totalPages) return;
    fetchSongs(page, songsState.limit, getSortString());
  };

  // Change items per page
  const changeLimit = (limit: number) => {
    fetchSongs(1, limit, getSortString());
  };

  // Set currently playing song
  const playSong = (song: ApiSong) => {
    currentlyPlaying.value = song;
    // Here we would also trigger actual playback,
    // but that will be implemented in a separate audio player composable
  };

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Initial fetch uses URL parameters
  await fetchSongs(pageParam, limitParam, sortParam || getSortString());

  return {
    // State
    songsState,
    currentlyPlaying,

    // Computed
    isSongPlaying: computed(
      () => (song: ApiSong) =>
        currentlyPlaying.value && currentlyPlaying.value._id === song._id
    ),
    hasSongs: computed(() => songsState.songs.length > 0),

    // Methods
    fetchSongs,
    changePage,
    changeSort,
    changeLimit,
    playSong,
    formatDuration,
  };
}
