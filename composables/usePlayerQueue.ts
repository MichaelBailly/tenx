import { computed, reactive } from "vue";
import type { ApiSong } from "~/types/api";

// State for the player queue
const queueState = reactive({
  songs: [] as ApiSong[],
  currentSongIndex: -1,
});

// Currently playing song reference
const currentlyPlayingSong = computed(() => {
  if (
    queueState.currentSongIndex >= 0 &&
    queueState.currentSongIndex < queueState.songs.length
  ) {
    return queueState.songs[queueState.currentSongIndex];
  }
  return null;
});

export function usePlayerQueue() {
  // Add a song to the queue - now allowing duplicates
  const addToQueue = (song: ApiSong) => {
    // Add the song to the queue, regardless of whether it's already there
    queueState.songs.push(song);
  };

  // Remove a song from the queue
  const removeFromQueue = (songId: string, index?: number) => {
    // If index is provided, use it directly
    if (index !== undefined) {
      // If removing the currently playing song, prevent removal
      if (index === queueState.currentSongIndex) {
        return false;
      }

      // Adjust current song index if removing a song before it
      if (index < queueState.currentSongIndex) {
        queueState.currentSongIndex--;
      }

      // Remove the song at the specified index
      queueState.songs.splice(index, 1);
      return true;
    }

    // Legacy fallback: find the song by ID if index is not provided
    const songIndex = queueState.songs.findIndex((s) => s._id === songId);
    if (songIndex !== -1) {
      // If removing the currently playing song, prevent removal
      if (songIndex === queueState.currentSongIndex) {
        return false;
      }

      // Adjust current song index if removing a song before it
      if (songIndex < queueState.currentSongIndex) {
        queueState.currentSongIndex--;
      }

      queueState.songs.splice(songIndex, 1);
      return true;
    }

    return false;
  };

  // Move a song within the queue (for reordering)
  const moveSongInQueue = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex >= 0 &&
      fromIndex < queueState.songs.length &&
      toIndex >= 0 &&
      toIndex < queueState.songs.length &&
      fromIndex !== toIndex
    ) {
      // Get the song to move
      const song = queueState.songs[fromIndex];

      // Remove song from current position
      queueState.songs.splice(fromIndex, 1);

      // Insert at new position
      queueState.songs.splice(toIndex, 0, song);

      // Update current song index if needed
      if (queueState.currentSongIndex === fromIndex) {
        queueState.currentSongIndex = toIndex;
      } else if (
        fromIndex < queueState.currentSongIndex &&
        toIndex >= queueState.currentSongIndex
      ) {
        queueState.currentSongIndex--;
      } else if (
        fromIndex > queueState.currentSongIndex &&
        toIndex <= queueState.currentSongIndex
      ) {
        queueState.currentSongIndex++;
      }

      return true;
    }
    return false;
  };

  // Clear the entire queue
  const clearQueue = () => {
    queueState.songs = [];
    queueState.currentSongIndex = -1;
  };

  // Play a specific song from the queue
  const playSongFromQueue = (index: number) => {
    if (index >= 0 && index < queueState.songs.length) {
      queueState.currentSongIndex = index;
      return queueState.songs[index];
    }
    return null;
  };

  // Play the next song in the queue
  const playNextSong = () => {
    if (queueState.songs.length === 0) return null;

    let nextIndex = queueState.currentSongIndex + 1;
    if (nextIndex >= queueState.songs.length) {
      nextIndex = 0; // Loop back to the beginning
    }

    queueState.currentSongIndex = nextIndex;
    return queueState.songs[nextIndex];
  };

  // Play the previous song in the queue
  const playPreviousSong = () => {
    if (queueState.songs.length === 0) return null;

    let prevIndex = queueState.currentSongIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queueState.songs.length - 1; // Loop to the end
    }

    queueState.currentSongIndex = prevIndex;
    return queueState.songs[prevIndex];
  };

  // Check if a song is currently playing
  const isSongPlaying = (songId: string) => {
    return currentlyPlayingSong.value?._id === songId;
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
    queueState,
    currentlyPlayingSong,

    // Methods
    addToQueue,
    removeFromQueue,
    moveSongInQueue,
    clearQueue,
    playSongFromQueue,
    playNextSong,
    playPreviousSong,
    isSongPlaying,
    formatDuration,
  };
}
