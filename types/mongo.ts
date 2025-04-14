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
