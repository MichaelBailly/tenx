import { defineStore } from "pinia";
import { useAudioEffectsStore } from "./audioEffects";
import { formatTimeDisplay } from "./audioUtils";
import { useAudioCorePlayerStore } from "./corePlayer";

/**
 * Main audio player store that combines functionality from core player and effects
 * This maintains the public API of the original audioPlayerStore for backwards compatibility
 */
export const useAudioPlayerStore = defineStore("audioPlayer", {
  /**
   * The state here is for TypeScript compatibility with the original store
   * Most functionality is delegated to the specialized stores
   */
  state: () => ({
    audioElement: null as HTMLAudioElement | null,
    previousAudioElement: null as HTMLAudioElement | null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    isLoading: false,
    error: null as string | null,
    seekPosition: null as number | null,
    playbackSpeed: 1.0,
    enableCrossfade: false,
    crossfadeDuration: 10,
    isCrossfading: false,
    isTransitioning: false,
  }),

  getters: {
    // Format current time as mm:ss
    formattedCurrentTime: () => {
      const corePlayerStore = useAudioCorePlayerStore();
      return formatTimeDisplay(corePlayerStore.currentTime);
    },

    // Format duration as mm:ss
    formattedDuration: () => {
      const corePlayerStore = useAudioCorePlayerStore();
      return formatTimeDisplay(corePlayerStore.duration);
    },

    // Progress as a percentage (0-100)
    progressPercentage: () => {
      const corePlayerStore = useAudioCorePlayerStore();
      return corePlayerStore.progressPercentage;
    },

    // Format seek position (when hovering) as mm:ss
    formattedSeekPosition: () => {
      const effectsStore = useAudioEffectsStore();
      return effectsStore.formattedSeekPosition;
    },

    // Format playback speed for display with one decimal place
    formattedPlaybackSpeed: () => {
      const effectsStore = useAudioEffectsStore();
      return effectsStore.formattedPlaybackSpeed;
    },

    // Format crossfade duration for display
    formattedCrossfadeDuration: () => {
      const effectsStore = useAudioEffectsStore();
      return effectsStore.formattedCrossfadeDuration;
    },
  },

  actions: {
    /**
     * Initialize the audio player
     */
    initialize() {
      const coreStore = useAudioCorePlayerStore();
      coreStore.initialize();

      // Sync state for compatibility with existing code
      this.audioElement = coreStore.audioElement;
    },

    /**
     * Clean up the audio player
     */
    cleanup() {
      const coreStore = useAudioCorePlayerStore();
      const effectsStore = useAudioEffectsStore();

      effectsStore.cleanupCrossfade();
      coreStore.cleanup();
    },

    /**
     * Load and play a song
     */
    loadSong(fileUrl: string) {
      const coreStore = useAudioCorePlayerStore();
      const effectsStore = useAudioEffectsStore();

      // Clean up any crossfade in progress
      effectsStore.cleanupCrossfade();

      // Reset playback speed to default (1.0x) for new songs
      effectsStore.setPlaybackSpeed(1.0);

      // Load the song
      coreStore.loadSong(fileUrl);

      // Sync state
      this.audioElement = coreStore.audioElement;
    },

    /**
     * Play the current song
     */
    play() {
      const coreStore = useAudioCorePlayerStore();
      coreStore.play();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Pause the current song
     */
    pause() {
      const coreStore = useAudioCorePlayerStore();
      coreStore.pause();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Toggle between play and pause
     */
    togglePlay() {
      const coreStore = useAudioCorePlayerStore();
      coreStore.togglePlay();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Play the next song in the queue
     */
    playNext() {
      const coreStore = useAudioCorePlayerStore();
      const effectsStore = useAudioEffectsStore();

      // Clean up any crossfade in progress
      effectsStore.cleanupCrossfade();

      coreStore.playNext();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Play the previous song in the queue
     */
    playPrevious() {
      const coreStore = useAudioCorePlayerStore();
      const effectsStore = useAudioEffectsStore();

      // Clean up any crossfade in progress
      effectsStore.cleanupCrossfade();

      coreStore.playPrevious();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Seek to a specific position in the song
     */
    seek(time: number) {
      const coreStore = useAudioCorePlayerStore();
      coreStore.seek(time);
    },

    /**
     * Seek to a percentage position in the song
     */
    seekByPercentage(percentage: number) {
      const coreStore = useAudioCorePlayerStore();
      coreStore.seekByPercentage(percentage);
    },

    /**
     * Set the volume level
     */
    setVolume(level: number) {
      const coreStore = useAudioCorePlayerStore();
      coreStore.setVolume(level);
    },

    /**
     * Toggle mute state
     */
    toggleMute() {
      const coreStore = useAudioCorePlayerStore();
      coreStore.toggleMute();
      this.isMuted = coreStore.isMuted;
    },

    /**
     * Stop and reset the audio player
     */
    stop() {
      const coreStore = useAudioCorePlayerStore();
      const effectsStore = useAudioEffectsStore();

      // Clean up any crossfade in progress
      effectsStore.cleanupCrossfade();

      coreStore.stop();
      this.isPlaying = coreStore.isPlaying;
    },

    /**
     * Update seek position for hover indication
     */
    updateSeekPosition(percentage: number | null) {
      const effectsStore = useAudioEffectsStore();
      effectsStore.updateSeekPosition(percentage);
    },

    /**
     * Increase playback speed
     */
    increasePlaybackSpeed() {
      const effectsStore = useAudioEffectsStore();
      effectsStore.increasePlaybackSpeed();
      this.playbackSpeed = effectsStore.playbackSpeed;
    },

    /**
     * Decrease playback speed
     */
    decreasePlaybackSpeed() {
      const effectsStore = useAudioEffectsStore();
      effectsStore.decreasePlaybackSpeed();
      this.playbackSpeed = effectsStore.playbackSpeed;
    },

    /**
     * Set the playback speed
     */
    setPlaybackSpeed(speed: number) {
      const effectsStore = useAudioEffectsStore();
      effectsStore.setPlaybackSpeed(speed);
      this.playbackSpeed = effectsStore.playbackSpeed;
    },

    /**
     * Toggle crossfade feature
     */
    toggleCrossfade() {
      const effectsStore = useAudioEffectsStore();
      effectsStore.toggleCrossfade();
      this.enableCrossfade = effectsStore.enableCrossfade;
    },

    /**
     * Set the crossfade duration
     */
    setCrossfadeDuration(duration: number) {
      const effectsStore = useAudioEffectsStore();
      effectsStore.setCrossfadeDuration(duration);
      this.crossfadeDuration = effectsStore.crossfadeDuration;
    },

    // These handlers below are not used directly but are added for completeness

    handleTimeUpdate() {
      // This is now handled by the core player
    },

    handleMetadataLoaded() {
      // This is now handled by the core player
    },

    handleEnded() {
      // This is now handled by the core player
    },

    handleError() {
      // This is now handled by the core player
    },
  },
});

// Re-export the stores for direct access when needed
export { useAudioCorePlayerStore, useAudioEffectsStore };
