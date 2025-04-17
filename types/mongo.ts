/**
 * MongoDB data models
 * Defined based on the actual MongoDB schema
 */

/**
 * User document as stored in MongoDB
 */
export type MongoUser = {
  _id: string; // Unique identifier for the user
  depth: number; // Depth level of the user in the hierarchy
  login: string; // User's login name
  parent: string; // Parent user ID
  password: string; // Hashed password (SHA1)
  playlists: {
    _id: string; // Unique identifier for the playlist
    name: string; // Name of the playlist
    songs: string[]; // Array of song IDs in the playlist
  }[]; // Array of playlists
  sessions: {
    _id: string; // Unique identifier for the session
    ts_creation: number; // Timestamp of session creation (JS timestamp)
    ts_last_usage: number; // Timestamp of last session usage (JS timestamp)
    lang: string; // Language preference for the session
  }[]; // Array of session objects
  preferences: {
    playlist: {
      type: string; // Type of playlist (e.g., "default")
    };
    volume: number; // User's preferred volume level (between 0 and 1)
    dislikes: Record<string, boolean>; // Map of disliked song IDs
    likes: Record<string, boolean>; // Map of liked song IDs
    hiddenReviewHelper: boolean; // Whether the review helper is hidden
    audioFade: boolean | number; // nr of seconds for the audio fade feature
  };
};

/**
 * User session data
 */
export type UserSession = {
  _id: string;
  ts_creation: number;
  ts_last_usage: number;
  lang: string;
};

/**
 * Client-side user data (stripped of sensitive information)
 */
export type ClientUser = {
  userId: string;
  username: string;
  // Other non-sensitive fields that might be needed in the client
};

// MongoDB Song document interface
export type MongoSong = {
  _id: string;
  album?: string;
  artist?: string;
  date?: number;
  duration?: number;
  filename?: string;
  genre?: string;
  hits?: number;
  reviewed?: boolean;
  sha1?: string;
  title?: string;
  tokenartists?: string[];
  tokentitle?: string;
  tracknumber?: number;
  images?: {
    filename: string;
    sha1: string;
    alternatives: Record<string, { width: number; height: number }>;
  }[];
  sourceFile?: {
    type: string;
    extension: string;
  };
  ts_creation?: number;
  user?: string;
  valid?: boolean;
};

/**
 * MongoDB Artist document interface (from the artists view)
 */
export type MongoArtist = {
  _id: string; // Unique identifier for the artist (the artist name)
  songs: MongoSong[]; // Array of songs by the artist
  count: number; // Number of songs by the artist
  duration: number; // Total duration of all songs by the artist
  hits: number; // Total number of hits for all songs by the artist
  genres: string[]; // Array of genres for all songs by the artist
  ts_creation: number; // Timestamp of creation of the most recent song
};
