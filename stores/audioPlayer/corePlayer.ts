import { defineStore } from "pinia";
import { usePlayerQueueStore } from "../playerQueueStore";
import { useAudioEffectsStore } from "./audioEffects"; // Add this import
import { cleanupEventListeners, setupEventListeners } from "./audioUtils";

export const useAudioCorePlayerStore = defineStore("audioCorePlayer", {
  state: () => ({
    audioElement: null as HTMLAudioElement | null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8, // Default volume (0 to 1)
    isMuted: false,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    // Progress as a percentage (0-100)
    progressPercentage: (state) => {
      if (state.duration <= 0) return 0;
      return (state.currentTime / state.duration) * 100;
    },
  },

  actions: {
    /**
     * Initialize the audio player
     */
    initialize() {
      if (typeof window !== "undefined" && !this.audioElement) {
        this.audioElement = new Audio();

        // Set up event listeners for the audio element
        setupEventListeners(this.audioElement, this);

        // Apply volume setting
        this.audioElement.volume = this.volume;
      }
    },

    /**
     * Clean up the audio player (remove event listeners)
     */
    cleanup() {
      if (this.audioElement) {
        cleanupEventListeners(this.audioElement);
        this.audioElement = null;
      }

      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.isLoading = false;
      this.error = null;
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

      // Wait for the audio to be ready before playing
      const onCanPlay = () => {
        this.audioElement?.removeEventListener("canplay", onCanPlay);
        this.play();
      };

      this.audioElement.addEventListener("canplay", onCanPlay);
      this.audioElement.load(); // Explicitly load the new source
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
     * Stop and reset the audio player (used when clearing the queue)
     */
    stop() {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.removeAttribute("src");
        this.audioElement.load();
        // Clean up event listeners
        cleanupEventListeners(this.audioElement);
        this.audioElement = null;
      }
      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.isLoading = false;
      this.error = null;

      // Re-initialize a fresh audio element for next playback
      this.initialize();
    },

    // Handler functions to be used by the utility functions
    handleTimeUpdate(time: number) {
      this.currentTime = time;

      // Check if we should start crossfade
      const effectsStore = useAudioEffectsStore();
      effectsStore.checkForCrossfadeStart();
    },

    handleMetadataLoaded(duration: number) {
      this.duration = duration;
      this.isLoading = false;
    },

    handleError(errorCode: string) {
      this.isPlaying = false;
      this.isLoading = false;
      this.error = `Audio error code: ${errorCode}`;
    },

    setLoadingState(isLoading: boolean) {
      this.isLoading = isLoading;
    },

    // Add this missing handler for the ended event
    handleEnded() {
      const effectsStore = useAudioEffectsStore();
      effectsStore.handleSongEnded();
    },
  },
});
