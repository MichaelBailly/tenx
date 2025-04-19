import { computed } from "vue";
import { usePlayerQueueStore } from "~/stores/playerQueueStore";
import type { ApiSong } from "~/types/api";

export function usePlayerQueue() {
  const playerQueueStore = usePlayerQueueStore();

  // Format duration as mm:ss (this utility function doesn't need to be in the store)
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Enhanced addToQueue function that adds the fileUrl property
  const addToQueue = (song: ApiSong) => {
    // Add fileUrl property using song._id if it's not already present
    const songWithFileUrl = {
      ...song,
      fileUrl: song.fileUrl || song._id,
    };

    playerQueueStore.addToQueue(songWithFileUrl);
  };

  // Enhanced insertSongAt function that adds the fileUrl property
  const insertSongAt = (song: ApiSong, index: number) => {
    // Add fileUrl property using song._id if it's not already present
    const songWithFileUrl = {
      ...song,
      fileUrl: song.fileUrl || song._id,
    };

    return playerQueueStore.insertSongAt(songWithFileUrl, index);
  };

  return {
    // State and getters from store
    queueState: computed(() => ({
      songs: playerQueueStore.songs,
      currentSongIndex: playerQueueStore.currentSongIndex,
    })),
    currentlyPlayingSong: computed(() => playerQueueStore.currentlyPlayingSong),

    // Modified store actions
    addToQueue,
    insertSongAt,

    // Original store actions
    removeFromQueue: playerQueueStore.removeFromQueue,
    moveSongInQueue: playerQueueStore.moveSongInQueue,
    clearQueue: playerQueueStore.clearQueue,
    playSongFromQueue: playerQueueStore.playSongFromQueue,
    playNextSong: playerQueueStore.playNextSong,
    playPreviousSong: playerQueueStore.playPreviousSong,
    isSongPlaying: playerQueueStore.isSongPlaying,

    // Utility function
    formatDuration,
  };
}
