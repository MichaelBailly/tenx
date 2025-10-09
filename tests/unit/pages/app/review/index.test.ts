import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReviewIndexPage from "~/pages/app/review/index.vue";

// Mock the composable
const mockUseReviewSongsList = vi.fn();
vi.mock("~/composables/useReviewSongsList", () => ({
  useReviewSongsList: mockUseReviewSongsList,
}));

// Mock navigateTo
const mockNavigateTo = vi.fn();
vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
}));

describe("ReviewIndexPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", async () => {
    mockUseReviewSongsList.mockReturnValue({
      reviewSongsState: {
        songs: [],
        loading: true,
        error: null,
        currentPage: 1,
        totalPages: 0,
        totalSongs: 0,
        limit: 20,
        sortField: "ts_creation",
        sortDirection: "desc",
      },
      isLoading: { value: true },
      hasError: { value: false },
      hasSongs: { value: false },
      fetchReviewSongs: vi.fn(),
      changePage: vi.fn(),
      changeSort: vi.fn(),
      changeLimit: vi.fn(),
    });

    const wrapper = mount(ReviewIndexPage);

    expect(wrapper.text()).toContain("Loading");
  });

  it("renders error state", async () => {
    mockUseReviewSongsList.mockReturnValue({
      reviewSongsState: {
        songs: [],
        loading: false,
        error: "Test error",
        currentPage: 1,
        totalPages: 0,
        totalSongs: 0,
        limit: 20,
        sortField: "ts_creation",
        sortDirection: "desc",
      },
      isLoading: { value: false },
      hasError: { value: true },
      hasSongs: { value: false },
      fetchReviewSongs: vi.fn(),
      changePage: vi.fn(),
      changeSort: vi.fn(),
      changeLimit: vi.fn(),
    });

    const wrapper = mount(ReviewIndexPage);

    expect(wrapper.text()).toContain("Test error");
  });

  it("renders empty state", async () => {
    mockUseReviewSongsList.mockReturnValue({
      reviewSongsState: {
        songs: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 0,
        totalSongs: 0,
        limit: 20,
        sortField: "ts_creation",
        sortDirection: "desc",
      },
      isLoading: { value: false },
      hasError: { value: false },
      hasSongs: { value: false },
      fetchReviewSongs: vi.fn(),
      changePage: vi.fn(),
      changeSort: vi.fn(),
      changeLimit: vi.fn(),
    });

    const wrapper = mount(ReviewIndexPage);

    expect(wrapper.text()).toContain("No songs");
  });

  it("renders songs table", async () => {
    const mockSongs = [{ _id: "song1", title: "Test Song 1" }];
    mockUseReviewSongsList.mockReturnValue({
      reviewSongsState: {
        songs: mockSongs,
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        totalSongs: 1,
        limit: 20,
        sortField: "ts_creation",
        sortDirection: "desc",
      },
      isLoading: { value: false },
      hasError: { value: false },
      hasSongs: { value: true },
      fetchReviewSongs: vi.fn(),
      changePage: vi.fn(),
      changeSort: vi.fn(),
      changeLimit: vi.fn(),
    });

    const wrapper = mount(ReviewIndexPage);

    expect(wrapper.find("table").exists()).toBe(true);
    expect(wrapper.text()).toContain("Test Song 1");
  });

  it("calls navigateTo on review button click", async () => {
    const mockSongs = [{ _id: "song1", title: "Test Song 1" }];
    mockUseReviewSongsList.mockReturnValue({
      reviewSongsState: {
        songs: mockSongs,
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        totalSongs: 1,
        limit: 20,
        sortField: "ts_creation",
        sortDirection: "desc",
      },
      isLoading: { value: false },
      hasError: { value: false },
      hasSongs: { value: true },
      fetchReviewSongs: vi.fn(),
      changePage: vi.fn(),
      changeSort: vi.fn(),
      changeLimit: vi.fn(),
    });

    const wrapper = mount(ReviewIndexPage);

    const reviewButton = wrapper.find("button");
    await reviewButton.trigger("click");

    expect(mockNavigateTo).toHaveBeenCalledWith("/app/review/song1");
  });
});
