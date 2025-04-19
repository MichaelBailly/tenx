import { defineStore } from "pinia";
import type { ApiSong } from "~/types/api";

export const usePlayerQueueStore = defineStore("playerQueue", {
  state: () => ({
    songs: [] as ApiSong[],
    currentSongIndex: -1,
  }),

  getters: {
    // Currently playing song
    currentlyPlayingSong: (state) => {
      if (
        state.currentSongIndex >= 0 &&
        state.currentSongIndex < state.songs.length
      ) {
        return state.songs[state.currentSongIndex];
      }
      return null;
    },

    // Queue is empty
    isEmpty: (state) => state.songs.length === 0,

    // Total songs in queue
    queueCount: (state) => state.songs.length,
  },

  actions: {
    // Add a song to the queue
    addToQueue(song: ApiSong) {
      this.songs.push(song);
    },

    // Remove a song from the queue
    removeFromQueue(songId: string, index?: number) {
      // If index is provided, use it directly
      if (index !== undefined) {
        // If removing the currently playing song, prevent removal
        if (index === this.currentSongIndex) {
          return false;
        }

        // Adjust current song index if removing a song before it
        if (index < this.currentSongIndex) {
          this.currentSongIndex--;
        }

        // Remove the song at the specified index
        this.songs.splice(index, 1);
        return true;
      }

      // Legacy fallback: find the song by ID if index is not provided
      const songIndex = this.songs.findIndex((s) => s._id === songId);
      if (songIndex !== -1) {
        // If removing the currently playing song, prevent removal
        if (songIndex === this.currentSongIndex) {
          return false;
        }

        // Adjust current song index if removing a song before it
        if (songIndex < this.currentSongIndex) {
          this.currentSongIndex--;
        }

        this.songs.splice(songIndex, 1);
        return true;
      }

      return false;
    },

    // Move a song within the queue (for reordering)
    moveSongInQueue(fromIndex: number, toIndex: number) {
      if (
        fromIndex >= 0 &&
        fromIndex < this.songs.length &&
        toIndex >= 0 &&
        toIndex < this.songs.length &&
        fromIndex !== toIndex
      ) {
        // Get the song to move
        const song = this.songs[fromIndex];

        // Remove song from current position
        this.songs.splice(fromIndex, 1);

        // Insert at new position
        this.songs.splice(toIndex, 0, song);

        // Update current song index if needed
        if (this.currentSongIndex === fromIndex) {
          this.currentSongIndex = toIndex;
        } else if (
          fromIndex < this.currentSongIndex &&
          toIndex >= this.currentSongIndex
        ) {
          this.currentSongIndex--;
        } else if (
          fromIndex > this.currentSongIndex &&
          toIndex <= this.currentSongIndex
        ) {
          this.currentSongIndex++;
        }

        return true;
      }
      return false;
    },

    // Clear the entire queue
    clearQueue() {
      this.songs = [];
      this.currentSongIndex = -1;
    },

    // Play a specific song from the queue
    playSongFromQueue(index: number) {
      if (index >= 0 && index < this.songs.length) {
        this.currentSongIndex = index;
        return this.songs[index];
      }
      return null;
    },

    // Play the next song in the queue
    playNextSong() {
      if (this.songs.length === 0) return null;

      let nextIndex = this.currentSongIndex + 1;
      if (nextIndex >= this.songs.length) {
        nextIndex = 0; // Loop back to the beginning
      }

      this.currentSongIndex = nextIndex;
      return this.songs[nextIndex];
    },

    // Play the previous song in the queue
    playPreviousSong() {
      if (this.songs.length === 0) return null;

      let prevIndex = this.currentSongIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.songs.length - 1; // Loop to the end
      }

      this.currentSongIndex = prevIndex;
      return this.songs[prevIndex];
    },

    // Check if a song is currently playing
    isSongPlaying(songId: string) {
      return this.currentlyPlayingSong?._id === songId;
    },

    // Insert a song at a specific position in the queue
    insertSongAt(song: ApiSong, index: number) {
      if (index >= 0 && index <= this.songs.length) {
        this.songs.splice(index, 0, song);

        // Adjust current song index if inserting before currently playing song
        if (index <= this.currentSongIndex && this.currentSongIndex !== -1) {
          this.currentSongIndex++;
        }
        return true;
      }
      return false;
    },
  },
});
