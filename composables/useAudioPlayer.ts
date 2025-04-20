import { computed, onMounted, onUnmounted } from "vue";
import { useAudioPlayerStore } from "~/stores/audioPlayerStore";
import { usePlayerQueueStore } from "~/stores/playerQueueStore";

export function useAudioPlayer() {
  const audioPlayerStore = useAudioPlayerStore();
  const playerQueueStore = usePlayerQueueStore();

  // Initialize the audio player when component is mounted
  onMounted(() => {
    audioPlayerStore.initialize();
  });

  // Clean up when component is unmounted
  onUnmounted(() => {
    audioPlayerStore.cleanup();
  });

  return {
    // Player state
    isPlaying: computed(() => audioPlayerStore.isPlaying),
    currentTime: computed(() => audioPlayerStore.currentTime),
    duration: computed(() => audioPlayerStore.duration),
    isLoading: computed(() => audioPlayerStore.isLoading),
    error: computed(() => audioPlayerStore.error),
    seekPosition: computed(() => audioPlayerStore.seekPosition),
    playbackSpeed: computed(() => audioPlayerStore.playbackSpeed),

    // Formatted values
    formattedCurrentTime: computed(() => audioPlayerStore.formattedCurrentTime),
    formattedDuration: computed(() => audioPlayerStore.formattedDuration),
    formattedSeekPosition: computed(
      () => audioPlayerStore.formattedSeekPosition
    ),
    progressPercentage: computed(() => audioPlayerStore.progressPercentage),
    formattedPlaybackSpeed: computed(
      () => audioPlayerStore.formattedPlaybackSpeed
    ),

    // Queue-related data
    currentSong: computed(() => playerQueueStore.currentlyPlayingSong),

    // Player actions
    play: audioPlayerStore.play,
    pause: audioPlayerStore.pause,
    togglePlay: audioPlayerStore.togglePlay,
    playNext: audioPlayerStore.playNext,
    playPrevious: audioPlayerStore.playPrevious,
    seek: audioPlayerStore.seek,
    seekByPercentage: audioPlayerStore.seekByPercentage,
    updateSeekPosition: audioPlayerStore.updateSeekPosition,

    // Playback speed actions
    increasePlaybackSpeed: audioPlayerStore.increasePlaybackSpeed,
    decreasePlaybackSpeed: audioPlayerStore.decreasePlaybackSpeed,
    setPlaybackSpeed: audioPlayerStore.setPlaybackSpeed,

    // Additional actions
    loadSong: audioPlayerStore.loadSong,
    setVolume: audioPlayerStore.setVolume,
    toggleMute: audioPlayerStore.toggleMute,
    stop: audioPlayerStore.stop,
  };
}
