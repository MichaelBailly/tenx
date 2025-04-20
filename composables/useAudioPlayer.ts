import { computed, onMounted, onUnmounted } from "vue";
import {
  useAudioCorePlayerStore,
  useAudioEffectsStore,
} from "~/stores/audioPlayer";
import { useAudioPlayerStore } from "~/stores/audioPlayerStore";
import { usePlayerQueueStore } from "~/stores/playerQueueStore";

export function useAudioPlayer() {
  // Initialize all the necessary stores
  const audioPlayerStore = useAudioPlayerStore();
  const corePlayerStore = useAudioCorePlayerStore();
  const audioEffectsStore = useAudioEffectsStore();
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
    isPlaying: computed(() => corePlayerStore.isPlaying),
    currentTime: computed(() => corePlayerStore.currentTime),
    duration: computed(() => corePlayerStore.duration),
    isLoading: computed(() => corePlayerStore.isLoading),
    error: computed(() => corePlayerStore.error),
    seekPosition: computed(() => audioEffectsStore.seekPosition),
    playbackSpeed: computed(() => audioEffectsStore.playbackSpeed),

    // Crossfade state
    enableCrossfade: computed(() => audioEffectsStore.enableCrossfade),
    crossfadeDuration: computed(() => audioEffectsStore.crossfadeDuration),
    isCrossfading: computed(() => audioEffectsStore.isCrossfading),

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
    formattedCrossfadeDuration: computed(
      () => audioPlayerStore.formattedCrossfadeDuration
    ),

    // Queue-related data
    currentSong: computed(() => playerQueueStore.currentlyPlayingSong),

    // Player actions - using the main audioPlayerStore for backward compatibility
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

    // Crossfade actions
    toggleCrossfade: audioPlayerStore.toggleCrossfade,
    setCrossfadeDuration: audioPlayerStore.setCrossfadeDuration,

    // Additional actions
    loadSong: audioPlayerStore.loadSong,
    setVolume: audioPlayerStore.setVolume,
    toggleMute: audioPlayerStore.toggleMute,
    stop: audioPlayerStore.stop,
  };
}
