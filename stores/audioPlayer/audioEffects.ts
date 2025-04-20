import { defineStore } from "pinia";
import { usePlayerQueueStore } from "../playerQueueStore";
import { cleanupEventListeners, setupEventListeners } from "./audioUtils";
import { useAudioCorePlayerStore } from "./corePlayer";

export const useAudioEffectsStore = defineStore("audioEffects", {
  state: () => ({
    previousAudioElement: null as HTMLAudioElement | null, // For crossfade
    playbackSpeed: 1.0, // Default playback speed
    enableCrossfade: false, // Default crossfade state is disabled
    crossfadeDuration: 10, // Default crossfade duration in seconds
    isCrossfading: false, // Tracks if a crossfade is currently in progress
    isTransitioning: false, // Flag to track song transition (for UI updates during crossfade)
    seekPosition: null as number | null, // For hover indication
    isPrimaryAudioSource: true, // Flag to track which audio element is the primary source for UI updates
  }),

  getters: {
    // Format playback speed for display with one decimal place
    formattedPlaybackSpeed: (state) => {
      return `${state.playbackSpeed.toFixed(1)}x`;
    },

    // Format crossfade duration for display
    formattedCrossfadeDuration: (state) => {
      return `${state.crossfadeDuration}s`;
    },

    // Format seek position (when hovering) as mm:ss
    formattedSeekPosition: (state) => {
      if (state.seekPosition === null) return null;
      return formatTimeDisplay(state.seekPosition);
    },
  },

  actions: {
    /**
     * Update seek position for hover indication
     * @param percentage Position as percentage (0-100)
     */
    updateSeekPosition(percentage: number | null) {
      const corePlayerStore = useAudioCorePlayerStore();
      if (percentage === null) {
        this.seekPosition = null;
        return;
      }

      if (corePlayerStore.duration > 0) {
        this.seekPosition = (percentage / 100) * corePlayerStore.duration;
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

      const corePlayerStore = useAudioCorePlayerStore();
      if (corePlayerStore.audioElement) {
        corePlayerStore.audioElement.playbackRate = constrainedSpeed;
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
     * Check if we need to start a crossfade
     * Called periodically during playback
     */
    checkForCrossfadeStart() {
      const corePlayerStore = useAudioCorePlayerStore();

      if (
        this.enableCrossfade &&
        !this.isCrossfading &&
        corePlayerStore.audioElement &&
        corePlayerStore.duration > 0 &&
        corePlayerStore.duration - corePlayerStore.currentTime <=
          this.crossfadeDuration
      ) {
        this.startCrossfade();
      }
    },

    /**
     * Start crossfading to the next song
     */
    startCrossfade() {
      // If already crossfading, do nothing
      if (this.isCrossfading) return;

      const corePlayerStore = useAudioCorePlayerStore();
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
      const oldAudio = corePlayerStore.audioElement;
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
      setupEventListeners(newAudio, corePlayerStore);

      // Load the new audio
      newAudio.load();

      // Once the new audio can play, start the crossfade process
      newAudio.addEventListener(
        "canplay",
        () => {
          // Store target volume for the crossfade
          const targetVolume = corePlayerStore.volume;

          // Update player queue to the next song
          playerQueueStore.currentSongIndex = nextIndex;

          // Set the new audio as the current audio element
          corePlayerStore.audioElement = newAudio;
          this.previousAudioElement = oldAudio; // Store the old audio temporarily

          // Mark the new audio as primary source for updates
          this.isPrimaryAudioSource = true;

          // Mark old audio as no longer the primary source - prevents time updates
          oldAudio._isPrimarySource = false;

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
                corePlayerStore.duration = newAudio.duration;
              }

              // Set initial current time values from the new audio
              corePlayerStore.currentTime = newAudio.currentTime;

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
                  cleanupEventListeners(oldAudio);

                  // Clear the reference to the old audio
                  this.previousAudioElement = null;
                  this.isCrossfading = false;

                  // Make sure we're still playing
                  if (corePlayerStore.isPlaying && newAudio.paused) {
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
                corePlayerStore.currentTime = newAudio.currentTime;
              }, 50); // Update every 50ms for smooth transition
            })
            .catch((error) => {
              console.error("Error starting crossfade playback:", error.stack);
              this.isCrossfading = false;
              this.previousAudioElement = null;

              // If the new song fails to play, keep playing the old one
              oldAudio.volume = corePlayerStore.volume;
              oldAudio._isPrimarySource = true; // Restore as primary source
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
          if (oldAudio) {
            oldAudio.volume = corePlayerStore.volume;
            oldAudio._isPrimarySource = true; // Restore as primary source
          }
        },
        { once: true }
      );
    },

    /**
     * Clean up any crossfade elements (called when changing songs manually)
     */
    cleanupCrossfade() {
      if (this.isCrossfading && this.previousAudioElement) {
        // Stop the previous audio element
        this.previousAudioElement.pause();
        cleanupEventListeners(this.previousAudioElement);
        this.previousAudioElement = null;
        this.isCrossfading = false;
      }
    },

    /**
     * Called when a song playback ends
     * This allows for proper handling when crossfade is disabled
     */
    handleSongEnded() {
      // If not crossfading, play next song normally
      if (!this.isCrossfading) {
        const corePlayerStore = useAudioCorePlayerStore();
        corePlayerStore.playNext();
      }
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
