import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReviewSong } from "~/composables/useReviewSong";
import type { ApiSong } from "~/types/api";

// Mock the useFetch composable
const mockUseFetch = vi.fn();
vi.mock("#app", () => ({
  useFetch: mockUseFetch,
}));

describe("useReviewSong", () => {
  const mockSong: ApiSong = {
    _id: "song1",
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    genre: "Rock",
    date: 2020,
    tracknumber: 1,
    duration: 180,
    filename: "test.mp3",
    hits: 10,
    reviewed: false,
    sha1: "1234567890abcdef1234567890abcdef12345678",
    tokenartists: ["test-artist"],
    tokentitle: "test-song",
    canEdit: true,
    ts_creation: 1609459200000,
    valid: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default state", () => {
    const composable = useReviewSong("song1");
    expect(composable.song.value).toBe(null);
    expect(composable.loading.value).toBe(false);
    expect(composable.error.value).toBe(null);
  });

  it("fetches song successfully", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { success: true, data: mockSong } },
      error: { value: null },
    });

    const composable = useReviewSong("song1");
    await composable.fetchSong();

    expect(composable.song.value).toEqual(mockSong);
    expect(composable.loading.value).toBe(false);
    expect(composable.error.value).toBe(null);
  });

  it("handles fetch error", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: null },
      error: { value: new Error("Network error") },
    });

    const composable = useReviewSong("song1");
    await composable.fetchSong();

    expect(composable.song.value).toBe(null);
    expect(composable.loading.value).toBe(false);
    expect(composable.error.value).toBe("Failed to fetch song");
  });

  it("handles API error response", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { success: false, error: "Song not found" } },
      error: { value: null },
    });

    const composable = useReviewSong("song1");
    await composable.fetchSong();

    expect(composable.song.value).toBe(null);
    expect(composable.loading.value).toBe(false);
    expect(composable.error.value).toBe("Song not found");
  });

  it("saves song successfully", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { success: true } },
      error: { value: null },
    });

    const composable = useReviewSong("song1");
    const result = await composable.saveSong(mockSong);

    expect(result).toBe(true);
  });

  it("handles save error", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: { success: false, error: "Save failed" } },
      error: { value: null },
    });

    const composable = useReviewSong("song1");
    const result = await composable.saveSong(mockSong);

    expect(result).toBe(false);
  });

  it("handles save network error", async () => {
    mockUseFetch.mockResolvedValue({
      data: { value: null },
      error: { value: new Error("Network error") },
    });

    const composable = useReviewSong("song1");
    const result = await composable.saveSong(mockSong);

    expect(result).toBe(false);
  });
});
