import { useFetch } from "#app";
import { computed, reactive, ref } from "vue";
import type { ApiSong } from "~/types/api";
import type { ApiError } from "~/types/common";
import type { SongsApiResponse } from "~/types/songs";

// Store state for album songs
const albumSongsState = reactive({
  songs: [] as ApiSong[],
  loading: false,
  error: null as string | null,
  sortField: "tracknumber",
  sortDirection: "asc",
  totalDuration: 0,
});

// Currently playing song reference (shared with other composables)
const currentlyPlaying = ref<ApiSong | null>(null);

export async function useAlbumSongs() {
  // Helper to create sort string for API
  const getSortString = () => {
    return albumSongsState.sortDirection === "desc"
      ? `-${albumSongsState.sortField}`
      : albumSongsState.sortField;
  };

  // Fetch songs for a specific album
  const fetchAlbumSongs = async (albumName: string) => {
    albumSongsState.loading = true;
    albumSongsState.error = null;

    try {
      // Build query parameters with a large limit to get all songs
      const query = {
        limit: "1000", // Large enough to get all songs
        sort: getSortString(),
      };

      // Use Nuxt's useFetch to get album songs
      const { data, error } = await useFetch<SongsApiResponse>(
        `/api/v1/albums/${encodeURIComponent(albumName)}/songs`,
        {
          method: "GET",
          params: query,
        }
      );

      if (error.value) {
        const errorData = error.value.data as ApiError;
        throw new Error(
          errorData?.error ||
            `Failed to fetch songs for album: ${error.value.message}`
        );
      }

      if (!data.value?.success || !data.value.data) {
        throw new Error(data.value?.error || "Failed to fetch songs for album");
      }

      const responseData = data.value.data;

      // Validate response data shape
      if (!responseData.songs) {
        throw new Error("Unexpected API response format");
      }

      // Update state with response data
      albumSongsState.songs = responseData.songs;

      // Calculate total duration
      albumSongsState.totalDuration = responseData.songs.reduce(
        (total, song) => total + (song.duration || 0),
        0
      );

      return responseData.songs;
    } catch (error) {
      albumSongsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching songs for album:", error);
      return [];
    } finally {
      albumSongsState.loading = false;
    }
  };

  // Change sort field for album songs
  const changeSort = (field: string) => {
    if (field === albumSongsState.sortField) {
      // Toggle direction if field is the same
      albumSongsState.sortDirection =
        albumSongsState.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Set new field and reset direction to asc
      albumSongsState.sortField = field;
      albumSongsState.sortDirection = "asc";
    }

    // Sort the current songs array in place
    const multiplier = albumSongsState.sortDirection === "asc" ? 1 : -1;
    albumSongsState.songs.sort((a, b) => {
      const aValue = a[albumSongsState.sortField as keyof ApiSong];
      const bValue = b[albumSongsState.sortField as keyof ApiSong];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return multiplier * aValue.localeCompare(bValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return multiplier * (aValue - bValue);
      }
      return 0;
    });
  };

  // Set currently playing song
  const playSong = (song: ApiSong) => {
    currentlyPlaying.value = song;
  };

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Format long duration as hh:mm:ss
  const formatLongDuration = (seconds: number): string => {
    if (!seconds) return "0:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    // State
    albumSongsState,
    currentlyPlaying,

    // Computed
    isSongPlaying: computed(
      () => (song: ApiSong) =>
        currentlyPlaying.value && currentlyPlaying.value._id === song._id
    ),

    // Methods
    fetchAlbumSongs,
    changeSort,
    playSong,
    formatDuration,
    formatLongDuration,
  };
}
