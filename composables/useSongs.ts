import { computed, reactive, ref } from "vue";
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

export function useSongs() {
  // Fetch songs with pagination and sorting
  const fetchSongs = async (
    page = songsState.currentPage,
    limit = songsState.limit,
    sort = getSortString()
  ) => {
    songsState.loading = true;
    songsState.error = null;

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (sort) {
        params.append("sort", sort);
      }

      // Make API request
      const response = await fetch(`/api/v1/songs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch songs: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch songs");
      }

      // Update state with response data
      songsState.songs = data.data.songs;
      songsState.currentPage = data.data.pagination.page;
      songsState.totalPages = data.data.pagination.pages;
      songsState.totalSongs = data.data.pagination.total;
      songsState.limit = data.data.pagination.limit;

      return data.data.songs;
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

    // Refetch songs with new sort
    fetchSongs(1, songsState.limit, getSortString());
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
    playSong,
    formatDuration,
  };
}
