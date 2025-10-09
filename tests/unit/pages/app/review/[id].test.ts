import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewSongPage from "~/pages/app/review/[id].vue";

// Mock the composable
const mockUseReviewSong = vi.fn();
vi.mock("~/composables/useReviewSong", () => ({
  useReviewSong: mockUseReviewSong,
}));

// Mock navigateTo
const mockNavigateTo = vi.fn();
vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
}));

describe("ReviewSongPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", async () => {
    mockUseReviewSong.mockReturnValue({
      song: { value: null },
      loading: { value: true },
      error: { value: null },
      saveSong: vi.fn(),
      cancelEditing: vi.fn(),
    });

    const wrapper = mount(ReviewSongPage, {
      global: {
        mocks: {
          $route: { params: { id: "song1" } },
        },
      },
    });

    expect(wrapper.text()).toContain("Loading");
  });

  it("renders error state", async () => {
    mockUseReviewSong.mockReturnValue({
      song: { value: null },
      loading: { value: false },
      error: { value: "Test error" },
      saveSong: vi.fn(),
      cancelEditing: vi.fn(),
    });

    const wrapper = mount(ReviewSongPage, {
      global: {
        mocks: {
          $route: { params: { id: "song1" } },
        },
      },
    });

    expect(wrapper.text()).toContain("Test error");
  });

  it("shows 'Song not found' when no song", async () => {
    mockUseReviewSong.mockReturnValue({
      song: { value: null },
      loading: { value: false },
      error: { value: null },
      saveSong: vi.fn(),
      cancelEditing: vi.fn(),
    });

    const wrapper = mount(ReviewSongPage, {
      global: {
        mocks: {
          $route: { params: { id: "song1" } },
        },
      },
    });

    expect(wrapper.text()).toContain("Song not found");
  });

  it("navigates back on cancel", async () => {
    const mockCancelEditing = vi.fn();
    mockUseReviewSong.mockReturnValue({
      song: { value: { _id: "song1", title: "Test" } },
      loading: { value: false },
      error: { value: null },
      saveSong: vi.fn(),
      cancelEditing: mockCancelEditing,
    });

    const wrapper = mount(ReviewSongPage, {
      global: {
        mocks: {
          $route: { params: { id: "song1" } },
        },
      },
    });

    const cancelButton = wrapper.find("button");
    await cancelButton.trigger("click");

    expect(mockCancelEditing).toHaveBeenCalled();
    expect(mockNavigateTo).toHaveBeenCalledWith("/app/review");
  });
});
