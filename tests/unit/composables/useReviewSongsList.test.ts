import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReviewSongsList } from "~/composables/useReviewSongsList";
import type { ApiSong } from "~/types/api";

// Mock the useRoute and useRouter composables
const mockRoute = {
  query: {},
};

const mockRouter = {
  replace: vi.fn(),
};

vi.mock("#app", () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  useFetch: vi.fn(),
}));

// Mock $fetch
const mockFetch = vi.fn();
vi.mock("#imports", () => ({
  $fetch: mockFetch,
}));

describe("useReviewSongsList", () => {
  let composable: ReturnType<typeof useReviewSongsList>;

  const mockSongs: ApiSong[] = [
    {
      _id: "song1",
      title: "Test Song 1",
      artist: "Test Artist",
      album: "Test Album",
      genre: "Rock",
      date: 2020,
      tracknumber: 1,
      duration: 180,
      filename: "test1.mp3",
      hits: 10,
      reviewed: false,
      sha1: "1234567890abcdef1234567890abcdef12345678",
      tokenartists: ["test-artist"],
      tokentitle: "test-song-1",
      canEdit: true,
      ts_creation: 1609459200000,
      valid: true,
    },
    {
      _id: "song2",
      title: "Test Song 2",
      artist: "Test Artist",
      album: "Test Album",
      genre: "Rock",
      date: 2020,
      tracknumber: 2,
      duration: 200,
      filename: "test2.mp3",
      hits: 5,
      reviewed: false,
      sha1: "abcdef1234567890abcdef1234567890abcdef12",
      tokenartists: ["test-artist"],
      tokentitle: "test-song-2",
      canEdit: true,
      ts_creation: 1609459200000,
      valid: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    composable = useReviewSongsList();
  });

  it("initializes with default state", () => {
    expect(composable.reviewSongsState.songs).toEqual([]);
    expect(composable.reviewSongsState.loading).toBe(false);
    expect(composable.reviewSongsState.error).toBe(null);
    expect(composable.reviewSongsState.currentPage).toBe(1);
    expect(composable.reviewSongsState.totalPages).toBe(0);
    expect(composable.reviewSongsState.totalSongs).toBe(0);
    expect(composable.reviewSongsState.limit).toBe(20);
    expect(composable.reviewSongsState.sortField).toBe("ts_creation");
    expect(composable.reviewSongsState.sortDirection).toBe("desc");
  });

  it("computes isLoading correctly", () => {
    expect(composable.isLoading.value).toBe(false);
    composable.reviewSongsState.loading = true;
    expect(composable.isLoading.value).toBe(true);
  });

  it("computes hasError correctly", () => {
    expect(composable.hasError.value).toBe(false);
    composable.reviewSongsState.error = "Test error";
    expect(composable.hasError.value).toBe(true);
  });

  it("computes hasSongs correctly", () => {
    expect(composable.hasSongs.value).toBe(false);
    composable.reviewSongsState.songs = mockSongs;
    expect(composable.hasSongs.value).toBe(true);
  });

  it("changes page correctly", () => {
    composable.reviewSongsState.totalPages = 5;
    mockFetch.mockResolvedValue({
      success: true,
      data: {
        songs: [],
        pagination: { page: 3, pages: 5, total: 0, limit: 20 },
      },
    });
    composable.changePage(3);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("does not change page if out of bounds", () => {
    composable.reviewSongsState.totalPages = 5;
    composable.changePage(10);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("changes limit correctly", () => {
    mockFetch.mockResolvedValue({
      success: true,
      data: {
        songs: [],
        pagination: { page: 1, pages: 1, total: 0, limit: 50 },
      },
    });
    composable.changeLimit(50);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("changes sort field correctly", () => {
    composable.changeSort("title");
    expect(composable.reviewSongsState.sortField).toBe("title");
    expect(composable.reviewSongsState.sortDirection).toBe("asc");
  });

  it("toggles sort direction when same field", () => {
    composable.reviewSongsState.sortField = "title";
    composable.reviewSongsState.sortDirection = "asc";
    composable.changeSort("title");
    expect(composable.reviewSongsState.sortDirection).toBe("desc");
  });
});
