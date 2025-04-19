import { defineStore } from "pinia";
import { usePlayerQueueStore } from "./playerQueueStore";

export const useAudioPlayerStore = defineStore("audioPlayer", {
  state: () => ({
    audioElement: null as HTMLAudioElement | null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8, // Default volume (0 to 1)
    isMuted: false,
    isLoading: false,
    error: null as string | null,
    seekPosition: null as number | null, // For hover indication
  }),

  getters: {
    // Format current time as mm:ss
    formattedCurrentTime: (state) => {
      return formatTimeDisplay(state.currentTime);
    },

    // Format duration as mm:ss
    formattedDuration: (state) => {
      return formatTimeDisplay(state.duration);
    },

    // Progress as a percentage (0-100)
    progressPercentage: (state) => {
      if (state.duration <= 0) return 0;
      return (state.currentTime / state.duration) * 100;
    },

    // Format seek position (when hovering) as mm:ss
    formattedSeekPosition: (state) => {
      if (state.seekPosition === null) return null;
      return formatTimeDisplay(state.seekPosition);
    },
  },

  actions: {
    /**
     * Initialize the audio player
     */
    initialize() {
      if (typeof window !== "undefined" && !this.audioElement) {
        this.audioElement = new Audio();

        // Set up event listeners
        this.audioElement.addEventListener("timeupdate", this.handleTimeUpdate);
        this.audioElement.addEventListener(
          "loadedmetadata",
          this.handleMetadataLoaded
        );
        this.audioElement.addEventListener("ended", this.handleEnded);
        this.audioElement.addEventListener("error", this.handleError);
        this.audioElement.addEventListener(
          "waiting",
          () => (this.isLoading = true)
        );
        this.audioElement.addEventListener(
          "canplay",
          () => (this.isLoading = false)
        );

        // Apply volume setting
        this.audioElement.volume = this.volume;
      }
    },

    /**
     * Clean up the audio player (remove event listeners)
     */
    cleanup() {
      if (this.audioElement) {
        this.audioElement.removeEventListener(
          "timeupdate",
          this.handleTimeUpdate
        );
        this.audioElement.removeEventListener(
          "loadedmetadata",
          this.handleMetadataLoaded
        );
        this.audioElement.removeEventListener("ended", this.handleEnded);
        this.audioElement.removeEventListener("error", this.handleError);
        this.audioElement.removeEventListener("waiting", () => {});
        this.audioElement.removeEventListener("canplay", () => {});

        this.audioElement = null;
      }
    },

    /**
     * Load and play a song
     * @param fileUrl URL of the audio file to play
     */
    loadSong(fileUrl: string) {
      if (!this.audioElement) this.initialize();
      if (!this.audioElement) return;

      // Ensure the URL points to the audio endpoint with the proper format
      const audioUrl = fileUrl.startsWith("/audio/")
        ? fileUrl
        : `/audio/${fileUrl.charAt(2)}/${fileUrl}.ogg`;

      this.audioElement.src = audioUrl;
      this.currentTime = 0;
      this.duration = 0;
      this.isLoading = true;
      this.error = null;

      // Attempt to play the song
      this.play();
    },

    /**
     * Play the current song
     */
    play() {
      if (!this.audioElement || !this.audioElement.src) {
        // If no song is loaded, try to play from queue
        const playerQueueStore = usePlayerQueueStore();
        const currentSong = playerQueueStore.currentlyPlayingSong;

        if (currentSong && currentSong.fileUrl) {
          this.loadSong(currentSong.fileUrl);
          return;
        } else {
          // Try to start playing the first song in the queue
          const nextSong = playerQueueStore.playSongFromQueue(0);
          if (nextSong && nextSong.fileUrl) {
            this.loadSong(nextSong.fileUrl);
            return;
          }
        }
        return;
      }

      // Play the current song
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch((error) => {
          this.error = `Failed to play song: ${error.message}`;
          console.error("Play error:", error);
        });
    },

    /**
     * Pause the current song
     */
    pause() {
      if (this.audioElement && this.isPlaying) {
        this.audioElement.pause();
        this.isPlaying = false;
      }
    },

    /**
     * Toggle between play and pause
     */
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    /**
     * Play the next song in the queue
     */
    playNext() {
      const playerQueueStore = usePlayerQueueStore();
      const nextSong = playerQueueStore.playNextSong();

      if (nextSong && nextSong.fileUrl) {
        this.loadSong(nextSong.fileUrl);
      } else {
        // If there's no next song, stop playback
        this.pause();
        if (this.audioElement) {
          this.audioElement.currentTime = 0;
          this.currentTime = 0;
        }
      }
    },

    /**
     * Play the previous song in the queue
     */
    playPrevious() {
      const playerQueueStore = usePlayerQueueStore();
      const prevSong = playerQueueStore.playPreviousSong();

      if (prevSong && prevSong.fileUrl) {
        this.loadSong(prevSong.fileUrl);
      }
    },

    /**
     * Seek to a specific position in the song
     * @param time Position in seconds to seek to
     */
    seek(time: number) {
      if (this.audioElement && !isNaN(time) && isFinite(time)) {
        this.audioElement.currentTime = Math.max(
          0,
          Math.min(time, this.duration)
        );
        this.currentTime = this.audioElement.currentTime;
      }
    },

    /**
     * Seek to a percentage position in the song
     * @param percentage Position as percentage (0-100)
     */
    seekByPercentage(percentage: number) {
      if (this.audioElement && this.duration > 0) {
        const time = (percentage / 100) * this.duration;
        this.seek(time);
      }
    },

    /**
     * Set the volume level
     * @param level Volume level (0 to 1)
     */
    setVolume(level: number) {
      const volumeLevel = Math.max(0, Math.min(1, level));
      this.volume = volumeLevel;

      if (this.audioElement) {
        this.audioElement.volume = volumeLevel;
      }
    },

    /**
     * Toggle mute state
     */
    toggleMute() {
      this.isMuted = !this.isMuted;

      if (this.audioElement) {
        this.audioElement.muted = this.isMuted;
      }
    },

    /**
     * Update seek position for hover indication
     * @param percentage Position as percentage (0-100)
     */
    updateSeekPosition(percentage: number | null) {
      if (percentage === null) {
        this.seekPosition = null;
        return;
      }

      if (this.duration > 0) {
        this.seekPosition = (percentage / 100) * this.duration;
      } else {
        this.seekPosition = 0;
      }
    },

    // Event handlers
    handleTimeUpdate() {
      if (this.audioElement) {
        this.currentTime = this.audioElement.currentTime;
      }
    },

    handleMetadataLoaded() {
      if (this.audioElement) {
        this.duration = this.audioElement.duration;
        this.isLoading = false;
      }
    },

    handleEnded() {
      this.isPlaying = false;
      // Try to play the next song in the queue
      this.playNext();
    },

    handleError(event: Event) {
      const error = event.currentTarget as HTMLAudioElement;
      this.isPlaying = false;
      this.isLoading = false;
      this.error = `Audio error code: ${error.error?.code || "unknown"}`;
      console.error("Audio error:", error.error);
    },
  },
});

/**
 * Format time in seconds to mm:ss display format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
function formatTimeDisplay(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
