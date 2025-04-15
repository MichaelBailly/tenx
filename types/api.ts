/**
 * Song, sent from various API endpoints
 */
export type ApiSong = {
  _id: string; // Unique identifier for the song
  album: string; // Album name
  artist: string; // Artist name, as found in the metadata or entered by the user
  date: number; // Year of release
  duration: number; // Duration in seconds
  filename: string; // Filename of the song, as found when uploaded
  genre: string; // Genre of the song
  hits: number; // Number of times the song was played
  reviewed: boolean; // Whether the song has been reviewed
  sha1: string; // SHA-1 hash of the file
  title: string; // Title of the song
  tokenartists: string[]; // Tokenized artist names
  tokentitle: string; // Tokenized title of the song
  tracknumber: number; // Track number in the album
  ts_creation: number; // Timestamp of creation (JS timestamp)
  canEdit: boolean; // true if the user can edit the song
  valid: boolean; // Whether the song is valid
  images?: {
    // Optional images associated with the song
    filename?: string;
    sha1: string;
    alternatives: Record<string, { width: number; height: number }>;
  }[];
  sourceFile?: {
    // Optional source file metadata
    type: string;
    extension: string;
  };
};
