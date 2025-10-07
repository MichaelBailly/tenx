# Coding pattern preferences

- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don’t have duplicate logic.
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200–300 lines of code. Refactor at that point.
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite my .env file without first asking and confirming

# Technical Stack

- TypeScript and Vue js frontend with Tailwind CSS.
- Pinia is used for state management of the audio player and the player queue only.
- Nuxt.js as application server, used for server-side rendering, static site generation, and many other things. Pino is used to logging/debugging
- MongoDB as the database. Using the mongodb driver, no ORM or ODM.

- Focus on easy and readability code, over being performant.
- Fully implement all requested functionality. Ensure code is complete!
- Verify thoroughly finalised.
- Use early returns whenever possible to make the code more readable.
- Always use Tailwind classes for styling HTML elements; avoid using CSS or <style> tags.
- Always use composition api.
- Use descriptive variable and function/const names. Also, event functions should be named with a “handle” prefix, like “handleClick” for onClick and “handleKeyDown” for onKeyDown.
- Implement accessibility features on elements. For example, a tag should have a tabindex=“0”, aria-label, on:click, and on:keydown, and similar attributes.

---

description: Enforces the use of TypeScript for type safety in Vue 3 projects, especially for .ts files.
globs: \*_/_.ts

---

- Use TypeScript for type safety
- Implement proper props and emits definitions

---

description: General guidelines for Vue 3 components using the Composition API. This includes best practices and recommendations for component structure and reactive state management.
globs: \*_/_.vue

---

- Use setup() function for component logic
- Utilize ref and reactive for reactive state
- Implement computed properties with computed()
- Use watch and watchEffect for side effects
- Implement lifecycle hooks with onMounted, onUpdated, etc.
- Utilize provide/inject for dependency injection
- Avoid using provide/inject
- Utilize Vue 3's Teleport component when needed
- Use Suspense for async components
- Implement proper error handling
- Follow Vue 3 style guide and naming conventions

# Constraints on the data storage.

Data should be stored in MongoDB.

## Songs collection

Here is the schema for the songs collection

```javascript
{
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
  user: string; // id of the user who uploaded the song
  valid: boolean; // Whether the song is valid
}
```

Explanation of artist, title, tokenartists and tokentitle
The software tries to give its best guess on the title of the song and the artists in the song, given the metadata of the file. artist and title are the data found in the metadata, or entered by the user. Examples:

- If artist = "Beyonce Feat. Shakira" and title = "Beautiful Liar", then tokenartists = ["Beyonce", "Shakira"] and tokentitle = "Beautiful Liar".
- If artist = "Beyounce" and title = "Beautiful liar feat. Shakira", then tokenartists = ["Beyonce", "Shakira"] and tokentitle = "Beautiful liar".

## Artists view

The artists collection is a view, which means that it is automatically updated when the songs collection is updated, through the following aggregation pipeline:

```javascript
[
  { $addFields: { _artist: "$tokenartists" } },
  { $unwind: "$_artist" },
  { $match: { _artist: { $exists: true, $ne: "" } } },
  {
    $group: {
      _id: "$_artist",
      songs: { $push: "$$ROOT" },
      count: { $sum: 1 },
      duration: { $sum: "$duration" },
      hits: { $sum: "$hits" },
      genres: { $addToSet: "$genre" },
      ts_creation: { $max: "$ts_creation" },
    },
  },
];
```

The artists collection has the following schema:

```javascript
{
  _id: string; // Unique identifier for the artist
  songs: Song[]; // Array of songs by the artist
  count: number; // Number of songs by the artist
  duration: number; // Total duration of all songs by the artist
  hits: number; // Total number of hits for all songs by the artist
  genres: string[]; // Array of genres for all songs by the artist
  ts_creation: number; // Timestamp of creation of the most recent song (JS timestamp)
}
```

## Albums view

The albums collection is a view, which means that it is automatically updated when the songs collection is updated, through the following aggregation pipeline:

```javascript
[
  { $match: { album: { $exists: true, $ne: "" } } },
  {
    $group: {
      _id: "$album",
      songs: { $push: "$$ROOT" },
      count: { $sum: 1 },
      duration: { $sum: "$duration" },
      hits: { $sum: "$hits" },
      genres: { $addToSet: "$genre" },
      ts_creation: { $max: "$ts_creation" },
    },
  },
];
```

The albums collection has the following schema:

```javascript
{
  _id: string; // Unique identifier for the album
  songs: Song[]; // Array of songs in the album
  count: number; // Number of songs in the album
  duration: number; // Total duration of all songs in the album
  hits: number; // Total number of hits for all songs in the album
  genres: string[]; // Array of genres for all songs in the album
  ts_creation: number; // Timestamp of creation of the most recent song (JS timestamp)
}
```

## Users collection

Users are stored in a users collection.

The users collection has the following schema:

```javascript
{
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
    volume: number; // User's preferred volume level (between 0 and 1 )
    dislikes: Record<string, boolean>; // Map of disliked song IDs
    likes: Record<string, boolean>; // Map of liked song IDs
    hiddenReviewHelper: boolean; // Whether the review helper is hidden
    audioFade: boolean; // nr of seconds for the audio fade feature
  };
}
```

# Coding workflow preferences

- Focus on the areas of code relevant du the task
- Do not touch code that is not related to the task
- Write thorough tests for all major functionality
- Avoid making major changes to the patterns and architrecture of how a feature works, after it has shown to work well, unless explicitely structured
- Always think about what other methods and areas of code might be affected by code change
