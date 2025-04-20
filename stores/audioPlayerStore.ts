import { defineStore } from "pinia";
import { usePlayerQueueStore } from "./playerQueueStore";

export const useAudioPlayerStore = defineStore("audioPlayer", {
  state: () => ({
    audioElement: null as HTMLAudioElement | null,
    previousAudioElement: null as HTMLAudioElement | null, // Added for crossfade
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8, // Default volume (0 to 1)
    isMuted: false,
    isLoading: false,
    error: null as string | null,
    seekPosition: null as number | null, // For hover indication
    playbackSpeed: 1.0, // Default playback speed
    enableCrossfade: false, // Default crossfade state is disabled
    crossfadeDuration: 10, // Default crossfade duration in seconds
    isCrossfading: false, // Tracks if a crossfade is currently in progress
    isTransitioning: false, // Flag to track song transition (for UI updates during crossfade)
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

    // Format playback speed for display with one decimal place
    formattedPlaybackSpeed: (state) => {
      return `${state.playbackSpeed.toFixed(1)}x`;
    },

    // Format crossfade duration for display
    formattedCrossfadeDuration: (state) => {
      return `${state.crossfadeDuration}s`;
    },
  },

  actions: {
    /**
     * Initialize the audio player
     */
    initialize() {
      if (typeof window !== "undefined" && !this.audioElement) {
        this.audioElement = new Audio();

        // Use arrow functions to preserve 'this' context
        const handleTimeUpdate = () => {
          if (this.audioElement && !this.isCrossfading) {
            // Only update time from the current audio element when not crossfading
            this.currentTime = this.audioElement.currentTime;

            // Check if we need to start crossfading
            if (
              this.enableCrossfade &&
              !this.isCrossfading &&
              this.duration > 0 &&
              this.duration - this.currentTime <= this.crossfadeDuration
            ) {
              this.startCrossfade();
            }
          }
        };

        const handleMetadataLoaded = () => {
          if (this.audioElement) {
            this.duration = this.audioElement.duration;
            this.isLoading = false;
          }
        };

        const handleEnded = () => {
          this.isPlaying = false;
          // Try to play the next song in the queue
          this.playNext();
        };

        const handleError = (event: Event) => {
          const error = event.currentTarget as HTMLAudioElement;
          this.isPlaying = false;
          this.isLoading = false;
          this.error = `Audio error code: ${error.error?.code || "unknown"}`;
          console.error("Audio error:", error.error);
        };

        // Store these functions for later removal
        this.handleTimeUpdate = handleTimeUpdate;
        this.handleMetadataLoaded = handleMetadataLoaded;
        this.handleEnded = handleEnded;
        this.handleError = handleError;

        // Set up event listeners
        this.audioElement.addEventListener("timeupdate", handleTimeUpdate);
        this.audioElement.addEventListener(
          "loadedmetadata",
          handleMetadataLoaded
        );
        this.audioElement.addEventListener("ended", handleEnded);
        this.audioElement.addEventListener("error", handleError);
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

        // Apply playback speed
        this.audioElement.playbackRate = this.playbackSpeed;
        console.log(
          `Initialized audio element with playback speed: ${this.playbackSpeed}`
        );
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

      // Clean up next audio element if it exists
      if (this.previousAudioElement) {
        this.previousAudioElement.pause();
        this.previousAudioElement = null;
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

      // Reset playback speed to default (1.0x) for new songs
      this.playbackSpeed = 1.0;

      // Wait for the audio to be ready before playing
      const onCanPlay = () => {
        this.audioElement?.removeEventListener("canplay", onCanPlay);

        // Apply default playback speed (1.0x) to the new song
        if (this.audioElement) {
          this.audioElement.playbackRate = 1.0;
        }

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

      // If crossfading was in progress, clean up next audio element
      if (this.isCrossfading && this.previousAudioElement) {
        this.isCrossfading = false;
        this.previousAudioElement = null;
      }

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
        // Remove all event listeners by cleaning up
        this.cleanup();
      }
      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.isLoading = false;
      this.error = null;
      this.seekPosition = null;
      // Re-initialize a fresh audio element for next playback
      this.initialize();
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

    /**
     * Increase playback speed by 5% (0.05)
     */
    increasePlaybackSpeed() {
      const newSpeed = Math.min(2.0, this.playbackSpeed + 0.05);
      this.setPlaybackSpeed(newSpeed);
      console.log(`Increased speed to: ${newSpeed.toFixed(2)}`);
    },

    /**
     * Decrease playback speed by 5% (0.05)
     */
    decreasePlaybackSpeed() {
      const newSpeed = Math.max(0.5, this.playbackSpeed - 0.05);
      this.setPlaybackSpeed(newSpeed);
      console.log(`Decreased speed to: ${newSpeed.toFixed(2)}`);
    },

    /**
     * Set the playback speed
     * @param speed New playback speed (between 0.5 and 2.0)
     */
    setPlaybackSpeed(speed: number) {
      // Ensure speed is between 0.5 and 2.0
      const constrainedSpeed = Math.max(0.5, Math.min(2.0, speed));
      this.playbackSpeed = constrainedSpeed;

      if (this.audioElement) {
        this.audioElement.playbackRate = constrainedSpeed;
        console.log(`Set playbackRate to: ${constrainedSpeed}`);
      }
    },

    /**
     * Toggle crossfade feature
     */
    toggleCrossfade() {
      this.enableCrossfade = !this.enableCrossfade;
    },

    /**
     * Set the crossfade duration
     * @param duration Duration in seconds
     */
    setCrossfadeDuration(duration: number) {
      // Ensure duration is within reasonable bounds (1-30 seconds)
      this.crossfadeDuration = Math.max(1, Math.min(30, duration));
    },

    /**
     * Start crossfading to the next song
     */
    startCrossfade() {
      // If already crossfading, do nothing
      if (this.isCrossfading) return;

      const playerQueueStore = usePlayerQueueStore();

      // Check if there's a next song to crossfade to
      const currentIndex = playerQueueStore.currentSongIndex;
      const nextIndex =
        currentIndex + 1 < playerQueueStore.songs.length ? currentIndex + 1 : 0;

      // If we're at the end and there are no more songs, don't crossfade
      if (
        nextIndex === 0 &&
        currentIndex === playerQueueStore.songs.length - 1 &&
        playerQueueStore.songs.length <= 1
      ) {
        return;
      }

      const nextSong = playerQueueStore.songs[nextIndex];
      if (!nextSong || !nextSong.fileUrl) return;

      console.log(`Starting crossfade to next song: ${nextSong.title}`);
      this.isCrossfading = true;

      // Create a new audio element for the next song
      const newAudio = new Audio();

      // Keep reference to the previous audio element
      const oldAudio = this.audioElement;
      if (!oldAudio) return;

      // Ensure the URL points to the audio endpoint with the proper format
      const audioUrl = nextSong.fileUrl.startsWith("/audio/")
        ? nextSong.fileUrl
        : `/audio/${nextSong.fileUrl.charAt(2)}/${nextSong.fileUrl}.ogg`;

      newAudio.src = audioUrl;
      newAudio.volume = 0; // Start with volume 0

      // Apply the same playback speed to new audio element
      newAudio.playbackRate = this.playbackSpeed;

      // Make sure the new audio has the event listeners it needs
      this.setupEventListeners(newAudio);

      // Load the new audio
      newAudio.load();

      // Once the new audio can play, start the crossfade process
      newAudio.addEventListener(
        "canplay",
        () => {
          // Store target volume for the crossfade
          const targetVolume = this.volume;

          // Update player queue to the next song
          playerQueueStore.currentSongIndex = nextIndex;

          // Set the new audio as the current audio element
          this.audioElement = newAudio;
          this.previousAudioElement = oldAudio; // Store the old audio temporarily

          // Play the new song
          newAudio
            .play()
            .then(() => {
              console.log("New song started playing");

              // Calculate remaining time for old song
              const remainingTime = oldAudio.duration - oldAudio.currentTime;
              const crossfadeTime = Math.min(
                remainingTime,
                this.crossfadeDuration
              );

              // Update metadata right away
              if (newAudio.duration) {
                this.duration = newAudio.duration;
              }

              // Perform the volume crossfade
              const startTime = Date.now();
              const endTime = startTime + crossfadeTime * 1000;

              const fadeInterval = setInterval(() => {
                const now = Date.now();
                const progress = (now - startTime) / (endTime - startTime);

                if (progress >= 1) {
                  clearInterval(fadeInterval);

                  // Ensure the new audio is at full volume
                  newAudio.volume = targetVolume;

                  // Stop and remove the old audio element completely
                  oldAudio.pause();
                  this.cleanupEventListeners(oldAudio);

                  // Clear the reference to the old audio
                  this.previousAudioElement = null;
                  this.isCrossfading = false;

                  // Make sure we're still playing
                  if (this.isPlaying && newAudio.paused) {
                    console.log("Resuming playback after crossfade completion");
                    newAudio
                      .play()
                      .catch((e) =>
                        console.error("Failed to resume playback:", e)
                      );
                  }

                  console.log("Crossfade completed. Playing:", nextSong.title);
                  return;
                }

                // Fade out old audio
                oldAudio.volume = targetVolume * (1 - progress);

                // Fade in new audio
                newAudio.volume = targetVolume * progress;

                // Update current time from the new audio
                this.currentTime = newAudio.currentTime;
              }, 50); // Update every 50ms for smooth transition
            })
            .catch((error) => {
              console.error("Error starting crossfade playback:", error.stack);
              this.isCrossfading = false;
              this.previousAudioElement = null;

              // If the new song fails to play, keep playing the old one
              oldAudio.volume = this.volume;
            });
        },
        { once: true }
      );

      // Handle errors with new audio
      newAudio.addEventListener(
        "error",
        (e) => {
          console.error("Error loading next song for crossfade", e);
          this.isCrossfading = false;
          this.previousAudioElement = null;

          // If there's an error, make sure the current song keeps playing
          if (oldAudio) oldAudio.volume = this.volume;
        },
        { once: true }
      );
    },

    /**
     * Set up event listeners for an audio element
     */
    setupEventListeners(audioElement: HTMLAudioElement) {
      if (!audioElement) return;

      // Only add event listeners if they don't already exist
      const timeUpdateHandler = () => {
        if (audioElement === this.audioElement && !this.isCrossfading) {
          this.currentTime = audioElement.currentTime;

          // Check if we need to start crossfading
          if (
            this.enableCrossfade &&
            !this.isCrossfading &&
            audioElement.duration > 0 &&
            audioElement.duration - audioElement.currentTime <=
              this.crossfadeDuration
          ) {
            this.startCrossfade();
          }
        }
      };

      const metadataLoadedHandler = () => {
        if (audioElement === this.audioElement) {
          this.duration = audioElement.duration;
          this.isLoading = false;
        }
      };

      const endedHandler = () => {
        // Only handle ended event if this is the current audio element
        if (audioElement === this.audioElement) {
          // If we're not crossfading already, play the next song
          if (!this.isCrossfading) {
            this.isPlaying = false;
            this.playNext();
          }
        }
      };

      const errorHandler = (event) => {
        if (audioElement === this.audioElement) {
          this.isPlaying = false;
          this.isLoading = false;
          this.error = `Audio error code: ${
            event.target.error?.code || "unknown"
          }`;
          console.error("Audio error:", event.target.error);
        }
      };

      // Add event listeners
      audioElement.addEventListener("timeupdate", timeUpdateHandler);
      audioElement.addEventListener("loadedmetadata", metadataLoadedHandler);
      audioElement.addEventListener("ended", endedHandler);
      audioElement.addEventListener("error", errorHandler);
      audioElement.addEventListener("waiting", () => {
        if (audioElement === this.audioElement) this.isLoading = true;
      });
      audioElement.addEventListener("canplay", () => {
        if (audioElement === this.audioElement) this.isLoading = false;
      });

      // Store the event handlers on the element for later removal if needed
      audioElement._playerHandlers = {
        timeUpdate: timeUpdateHandler,
        metadataLoaded: metadataLoadedHandler,
        ended: endedHandler,
        error: errorHandler,
      };
    },

    /**
     * Clean up event listeners from an audio element
     */
    cleanupEventListeners(audioElement: HTMLAudioElement | null) {
      if (!audioElement || !audioElement._playerHandlers) return;

      // Remove all event listeners
      audioElement.removeEventListener(
        "timeupdate",
        audioElement._playerHandlers.timeUpdate
      );
      audioElement.removeEventListener(
        "loadedmetadata",
        audioElement._playerHandlers.metadataLoaded
      );
      audioElement.removeEventListener(
        "ended",
        audioElement._playerHandlers.ended
      );
      audioElement.removeEventListener(
        "error",
        audioElement._playerHandlers.error
      );
      audioElement.removeEventListener("waiting", () => {});
      audioElement.removeEventListener("canplay", () => {});

      // Delete the reference to handlers
      delete audioElement._playerHandlers;
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
