import { useFetch } from "#app";
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ApiSong } from "~/types/api";
import type { ApiError } from "~/types/common";
import type { SongsApiResponse, SongsState } from "~/types/songs";

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

  // Get query parameters
  const pageParam = Number(route.query.page) || 1;
  const limitParam = Number(route.query.limit) || 20;
  const sortParam = (route.query.sort as string) || "title";
  const qParam = (route.query.q as string) || "";

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

  // Add searchTerm ref
  const searchTerm = ref(qParam);

  // Update URL when state changes
  const updateURL = (page: number, limit: number, sort: string, q: string) => {
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

    if (!q) {
      delete query.q;
    } else {
      query.q = q;
    }

    // Replace current URL with new query parameters
    router.replace({ query });
  };

  // Fetch songs with pagination, sorting, and search
  const fetchSongs = async (
    page = songsState.currentPage,
    limit = songsState.limit,
    sort = getSortString(),
    q = searchTerm.value
  ) => {
    songsState.loading = true;
    songsState.error = null;

    try {
      // Build query parameters
      const query: Record<string, string | undefined> = {
        page: page.toString(),
        limit: limit.toString(),
        sort,
      };

      if (q) query.q = q;

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
      updateURL(page, limit, sort, q);

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
    fetchSongs(1, songsState.limit, newSortString, searchTerm.value);
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
    fetchSongs(page, songsState.limit, getSortString(), searchTerm.value);
  };

  // Change items per page
  const changeLimit = (limit: number) => {
    fetchSongs(1, limit, getSortString(), searchTerm.value);
  };

  // New: Change search term
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  const changeSearch = (q: string) => {
    searchTerm.value = q;
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      fetchSongs(1, songsState.limit, getSortString(), q);
    }, 400);
  };

  // Watch for route changes (e.g., browser navigation)
  watch(
    () => route.query.q,
    (newQ) => {
      if (typeof newQ === "string" && newQ !== searchTerm.value) {
        searchTerm.value = newQ;
        fetchSongs(1, songsState.limit, getSortString(), newQ);
      }
    }
  );

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
  await fetchSongs(pageParam, limitParam, sortParam || getSortString(), qParam);

  return {
    // State
    songsState,
    currentlyPlaying,
    searchTerm,

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
    changeSearch,
    playSong,
    formatDuration,
  };
}
