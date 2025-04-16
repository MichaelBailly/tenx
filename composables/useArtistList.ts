import { useFetch } from "#app";
import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

// Types
export interface Artist {
  _id: string;
  count: number;
  duration: number;
  hits: number;
  genres: string[];
  ts_creation: number;
}

interface ArtistsState {
  artists: Artist[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalArtists: number;
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

interface ArtistsApiResponse {
  success: boolean;
  error?: string;
  data?: {
    artists: Artist[];
    pagination: Pagination;
  };
}

interface ApiError {
  code?: string;
  data?: {
    totalPages?: number;
    totalArtists?: number;
  };
  error?: string;
}

// Create global store for state
const artistsState = reactive<ArtistsState>({
  artists: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalArtists: 0,
  limit: 20,
  sortField: "_id",
  sortDirection: "asc",
});

export async function useArtistList() {
  const route = useRoute();
  const router = useRouter();

  // Initialize state from URL params
  const pageParam = Number(route.query.page) || 1;
  const limitParam = Number(route.query.limit) || 20;
  const sortParam = (route.query.sort as string) || "_id";

  // Parse sort field and direction
  if (sortParam) {
    if (sortParam.startsWith("-")) {
      artistsState.sortField = sortParam.substring(1);
      artistsState.sortDirection = "desc";
    } else {
      artistsState.sortField = sortParam;
      artistsState.sortDirection = "asc";
    }
  }

  // Set pagination parameters
  artistsState.currentPage = pageParam;
  artistsState.limit = limitParam;

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

    if (sort === "_id") {
      delete query.sort;
    } else {
      query.sort = sort;
    }

    // Replace current URL with new query parameters
    router.replace({ query });
  };

  // Helper to create sort string for API
  const getArtistsSortString = () => {
    return artistsState.sortDirection === "desc"
      ? `-${artistsState.sortField}`
      : artistsState.sortField;
  };

  // Fetch artists with pagination and sorting
  const fetchArtists = async (
    page = artistsState.currentPage,
    limit = artistsState.limit,
    sort = getArtistsSortString()
  ) => {
    artistsState.loading = true;
    artistsState.error = null;

    try {
      // Build query parameters
      const query = {
        page: page.toString(),
        limit: limit.toString(),
        sort,
      };

      // Use Nuxt's useFetch instead of native fetch
      const { data, error } = await useFetch<ArtistsApiResponse>(
        "/api/v1/artists",
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
          artistsState.totalPages = errorData.data.totalPages;
          artistsState.totalArtists = errorData.data.totalArtists || 0;

          // Redirect to the last available page
          return fetchArtists(errorData.data.totalPages, limit, sort);
        }

        throw new Error(
          errorData?.error || `Failed to fetch artists: ${error.value.message}`
        );
      }

      // Make sure we have data
      if (!data.value?.success || !data.value.data) {
        throw new Error(data.value?.error || "Failed to fetch artists");
      }

      const responseData = data.value.data;

      // Validate response data shape
      if (!responseData.artists || !responseData.pagination) {
        throw new Error("Unexpected API response format");
      }

      // Update state with response data
      artistsState.artists = responseData.artists;
      artistsState.currentPage = responseData.pagination.page;
      artistsState.totalPages = responseData.pagination.pages;
      artistsState.totalArtists = responseData.pagination.total;
      artistsState.limit = responseData.pagination.limit;

      // Update URL to reflect current state
      updateURL(page, limit, sort);

      return responseData.artists;
    } catch (error) {
      artistsState.error =
        error instanceof Error ? error.message : "An error occurred";
      console.error("Error fetching artists:", error);
      return [];
    } finally {
      artistsState.loading = false;
    }
  };

  // Change sort field for artists
  const changeSort = (field: string) => {
    if (field === artistsState.sortField) {
      // Toggle direction if field is the same
      artistsState.sortDirection =
        artistsState.sortDirection === "asc" ? "desc" : "asc";
    } else {
      // Set new field and reset direction to asc
      artistsState.sortField = field;
      artistsState.sortDirection = "asc";
    }

    const newSortString = getArtistsSortString();

    // Refetch artists with new sort and reset to first page
    fetchArtists(1, artistsState.limit, newSortString);
  };

  // Change artists page
  const changePage = (page: number) => {
    if (page < 1 || page > artistsState.totalPages) return;
    fetchArtists(page, artistsState.limit, getArtistsSortString());
  };

  // Change items per page for artists
  const changeLimit = (limit: number) => {
    fetchArtists(1, limit, getArtistsSortString());
  };

  // Format duration as hh:mm:ss
  const formatLongDuration = (seconds: number): string => {
    if (!seconds) return "0:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Initial fetch uses URL parameters
  onServerPrefetch(async () =>
    fetchArtists(pageParam, limitParam, sortParam || getArtistsSortString())
  );

  // Load artist songs when the component mounts
  onMounted(() => {
    if (!artistsState.artists.length) {
      fetchArtists(pageParam, limitParam, sortParam || getArtistsSortString());
    }
  });

  return {
    // State
    artistsState,

    // Methods
    fetchArtists,
    changeSort,
    changePage,
    changeLimit,
    formatLongDuration,
  };
}
