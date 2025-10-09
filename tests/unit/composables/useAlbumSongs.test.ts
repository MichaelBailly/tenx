import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAlbumSongs } from "~/composables/useAlbumSongs";
import type { ApiSong } from "~/types/api";

// Mock the useFetch composable
vi.mock("#app", () => ({
  useFetch: vi.fn(() =>
    Promise.resolve({
      data: { value: { success: true, data: { songs: [] } } },
      error: { value: null },
    })
  ),
}));

describe("useAlbumSongs", () => {
  let composable: Awaited<ReturnType<typeof useAlbumSongs>>;

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
      reviewed: true,
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
      reviewed: true,
      sha1: "abcdef1234567890abcdef1234567890abcdef12",
      tokenartists: ["test-artist"],
      tokentitle: "test-song-2",
      canEdit: false,
      ts_creation: 1609459200000,
      valid: true,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    composable = await useAlbumSongs();
  });

  describe("initial state", () => {
    it("should initialize with correct default values", () => {
      expect(composable.albumSongsState.songs).toEqual([]);
      expect(composable.albumSongsState.loading).toBe(false);
      expect(composable.albumSongsState.error).toBe(null);
      expect(composable.albumSongsState.sortField).toBe("tracknumber");
      expect(composable.albumSongsState.sortDirection).toBe("asc");
      expect(composable.albumSongsState.totalDuration).toBe(0);
    });
  });

  describe("changeSort", () => {
    beforeEach(() => {
      // Set up some songs to sort
      composable.albumSongsState.songs = [...mockSongs];
    });

    it("should toggle sort direction when same field is selected", () => {
      composable.changeSort("tracknumber");

      expect(composable.albumSongsState.sortField).toBe("tracknumber");
      expect(composable.albumSongsState.sortDirection).toBe("desc");
    });

    it("should change field and reset direction to asc when different field is selected", () => {
      composable.changeSort("title");

      expect(composable.albumSongsState.sortField).toBe("title");
      expect(composable.albumSongsState.sortDirection).toBe("asc");
    });

    it("should sort songs by tracknumber ascending", () => {
      // Set up unsorted songs
      composable.albumSongsState.songs = [
        { ...mockSongs[1] }, // tracknumber: 2
        { ...mockSongs[0] }, // tracknumber: 1
      ];

      // Calling changeSort("tracknumber") when already on "tracknumber" toggles to desc
      // But let's test the sorting logic by setting the direction first
      composable.albumSongsState.sortDirection = "asc";
      composable.changeSort("tracknumber"); // This should sort ascending

      expect(composable.albumSongsState.songs[0].tracknumber).toBe(1);
      expect(composable.albumSongsState.songs[1].tracknumber).toBe(2);
    });

    it("should sort songs by title descending", () => {
      composable.albumSongsState.sortDirection = "asc";
      composable.changeSort("title"); // This should set to asc first

      // Set up unsorted songs
      composable.albumSongsState.songs = [
        { ...mockSongs[0] }, // "Test Song 1"
        { ...mockSongs[1] }, // "Test Song 2"
      ];

      composable.changeSort("title"); // Now toggle to desc

      expect(composable.albumSongsState.songs[0].title).toBe("Test Song 2");
      expect(composable.albumSongsState.songs[1].title).toBe("Test Song 1");
    });
  });

  describe("formatDuration", () => {
    it("should format duration in seconds to mm:ss format", () => {
      expect(composable.formatDuration(0)).toBe("0:00");
      expect(composable.formatDuration(59)).toBe("0:59");
      expect(composable.formatDuration(60)).toBe("1:00");
      expect(composable.formatDuration(125)).toBe("2:05");
      expect(composable.formatDuration(3661)).toBe("61:01");
    });

    it("should handle falsy values", () => {
      expect(composable.formatDuration(0)).toBe("0:00");
    });
  });

  describe("formatLongDuration", () => {
    it("should format duration in seconds to hh:mm:ss format", () => {
      expect(composable.formatLongDuration(0)).toBe("0:00:00");
      expect(composable.formatLongDuration(59)).toBe("0:00:59");
      expect(composable.formatLongDuration(60)).toBe("0:01:00");
      expect(composable.formatLongDuration(125)).toBe("0:02:05");
      expect(composable.formatLongDuration(3661)).toBe("1:01:01");
      expect(composable.formatLongDuration(7265)).toBe("2:01:05");
    });

    it("should handle falsy values", () => {
      expect(composable.formatLongDuration(0)).toBe("0:00:00");
    });
  });
});
