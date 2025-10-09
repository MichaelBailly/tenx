import { ref } from "vue";
import type { ApiSong } from "~/types/api";

export function useReviewSong(songId: string) {
  const song = ref<ApiSong | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch the song for review
  const fetchSong = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch<{
        success: boolean;
        data?: ApiSong;
        error?: string;
      }>(`/api/v1/songs/${songId}`, {
        method: "GET",
        credentials: "include",
      });

      if (fetchError.value) {
        console.error("Error fetching song:", fetchError.value);
        error.value = "Failed to fetch song";
        return;
      }

      if (!data.value?.success || !data.value.data) {
        console.error("Failed to fetch song:", data.value?.error);
        error.value = data.value?.error || "Song not found";
        return;
      }

      song.value = data.value.data;
    } catch (e) {
      console.error("Exception fetching song:", e);
      error.value = "An error occurred while fetching the song";
    } finally {
      loading.value = false;
    }
  };

  // Save edited song metadata
  const saveSong = async (updatedSong: ApiSong): Promise<boolean> => {
    try {
      const { data, error: saveError } = await useFetch<{
        success: boolean;
        error?: string;
      }>(`/api/v1/songs/${songId}`, {
        method: "PUT",
        body: {
          title: updatedSong.title,
          artist: updatedSong.artist,
          album: updatedSong.album || "",
          genre: updatedSong.genre,
          date: updatedSong.date,
          tracknumber: updatedSong.tracknumber,
          reviewed: true, // Mark as reviewed
        },
      });

      if (saveError.value) {
        console.error("Error saving song:", saveError.value);
        return false;
      }

      if (!data.value?.success) {
        console.error("Failed to save song:", data.value?.error);
        return false;
      }

      return true;
    } catch (e) {
      console.error("Exception saving song:", e);
      return false;
    }
  };

  // Cancel editing (no-op for now, but can be extended)
  const cancelEditing = () => {
    // Could add confirmation dialog here if needed
  };

  // Fetch song on mount
  onMounted(() => {
    fetchSong();
  });

  return {
    song,
    loading,
    error,
    fetchSong,
    saveSong,
    cancelEditing,
  };
}
