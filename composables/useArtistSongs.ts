import { useFetch } from "#app";
import { computed, reactive, ref } from "vue";
import type { ApiSong } from "~/types/api";

type ArtistSongsState = {
  songs: ApiSong[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalSongs: number;
  limit: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  artistId: string | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type SongsApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    songs: ApiSong[];
    pagination: Pagination;
    artist: string;
  };
};

type ApiError = {
  code?: string;
  data?: {
    totalPages?: number;
    totalSongs?: number;
  };
  error?: string;
};

// Currently playing song reference (shared with useSongs)
const currentlyPlaying = ref<ApiSong | null>(null);

export async function useArtistSongs() {
  // Helper to create sort string for API
  const getSortString = () => {
    return artistSongsState.sortDirection === "desc"
      ? `-${artistSongsState.sortField}`
      : artistSongsState.sortField;
  };

  // Create global store for state
  const artistSongsState = reactive<ArtistSongsState>({
    songs: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalSongs: 0,
    limit: 20,
    sortField: "title",
    sortDirection: "asc",
    artistId: null,
  });

  const route = useRoute();

  const artistId = ref(decodeURIComponent(route.params.id as string));

  // Fetch songs for a specific artist
  const fetchArtistSongs = async (
    artistId: string,
    page = 1,
    limit = artistSongsState.limit,
    sort = getSortString()
  ) => {
    artistSongsState.loading = true;
    artistSongsState.error = null;
    artistSongsState.artistId = artistId;

    try {
      // Build query parameters
      const query = {
        page: page.toString(),
        limit: limit.toString(),
        sort,
      };

      // Use Nuxt's useFetch instead of native fetch
      const { data, error } = await useFetch<SongsApiResponse>(
        `/api/v1/artists/${encodeURIComponent(artistId)}/songs`,
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
          artistSongsState.totalPages = errorData.data.totalPages;
          artistSongsState.totalSongs = errorData.data.totalSongs || 0;

          // Redirect to the last available page
          return fetchArtistSongs(
            artistId,
            errorData.data.totalPages,
            limit,
            sort
          );
        }

        throw new Error(
          errorData?.error ||
            `Failed to fetch songs for artist: ${error.value.message}`
        );
      }

      // Make sure we have data
      if (!data.value?.success || !data.value.data) {
        throw new Error(
          data.value?.error || "Failed to fetch songs for artist"
        );
      }

      const responseData = data.value.data;

      // Validate response data shape
      if (!responseData.songs || !responseData.pagination) {
        throw new Error("Unexpected API response format");
      }

      // Update state with response data
      artistSongsState.songs = responseData.songs;
      artistSongsState.currentPage = responseData.pagination.page;
      artistSongsState.totalPages = responseData.pagination.pages;
      artistSongsState.totalSongs = responseData.pagination.total;
      artistSongsState.limit = responseData.pagination.limit;

      return responseData.songs;
    } catch (error) {
      artistSongsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching songs for artist:", error);
      return [];
    } finally {
      artistSongsState.loading = false;
    }
  };

  // Change sort field for artist songs
  const changeSort = (field: string) => {
    if (field === artistSongsState.sortField) {
      // Toggle direction if field is the same
      artistSongsState.sortDirection =
        artistSongsState.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Set new field and reset direction to asc
      artistSongsState.sortField = field;
      artistSongsState.sortDirection = "asc";
    }

    if (artistSongsState.artistId) {
      const newSortString = getSortString();
      // Refetch songs with new sort and reset to first page
      fetchArtistSongs(
        artistSongsState.artistId,
        1,
        artistSongsState.limit,
        newSortString
      );
    }
  };

  // Change artist songs page
  const changePage = (page: number) => {
    if (
      page < 1 ||
      page > artistSongsState.totalPages ||
      !artistSongsState.artistId
    )
      return;
    fetchArtistSongs(
      artistSongsState.artistId,
      page,
      artistSongsState.limit,
      getSortString()
    );
  };

  // Change items per page for artist songs
  const changeLimit = (limit: number) => {
    if (!artistSongsState.artistId) return;
    fetchArtistSongs(artistSongsState.artistId, 1, limit, getSortString());
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

  // Load artist songs: serverside first, then on client
  onServerPrefetch(async () => fetchArtistSongs(artistId.value));

  // Load artist songs when the component mounts
  onMounted(() => {
    if (!artistSongsState.songs.length) {
      fetchArtistSongs(artistId.value);
    }
  });

  return {
    // State
    artistSongsState,
    currentlyPlaying,
    artistId,

    // Computed
    isSongPlaying: computed(
      () => (song: ApiSong) =>
        currentlyPlaying.value && currentlyPlaying.value._id === song._id
    ),

    // Methods
    fetchArtistSongs,
    changeSort,
    changePage,
    changeLimit,
    playSong,
    formatDuration,
  };
}
