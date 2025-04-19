import { computed } from "vue";
import { usePlayerQueueStore } from "~/stores/playerQueueStore";

export function usePlayerQueue() {
  const playerQueueStore = usePlayerQueueStore();

  // Format duration as mm:ss (this utility function doesn't need to be in the store)
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return {
    // State and getters from store
    queueState: computed(() => ({
      songs: playerQueueStore.songs,
      currentSongIndex: playerQueueStore.currentSongIndex,
    })),
    currentlyPlayingSong: computed(() => playerQueueStore.currentlyPlayingSong),

    // Store actions
    addToQueue: playerQueueStore.addToQueue,
    removeFromQueue: playerQueueStore.removeFromQueue,
    moveSongInQueue: playerQueueStore.moveSongInQueue,
    clearQueue: playerQueueStore.clearQueue,
    playSongFromQueue: playerQueueStore.playSongFromQueue,
    playNextSong: playerQueueStore.playNextSong,
    playPreviousSong: playerQueueStore.playPreviousSong,
    isSongPlaying: playerQueueStore.isSongPlaying,
    insertSongAt: playerQueueStore.insertSongAt,

    // Utility function
    formatDuration,
  };
}
