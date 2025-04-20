/**
 * Utilities for audio player management
 */

/**
 * Format time in seconds to mm:ss display format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTimeDisplay(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Set up all necessary event listeners for an audio element
 * @param audioElement The audio element to set up
 * @param store The store with handler methods
 */
interface AudioPlayerStore {
  handleTimeUpdate?: (currentTime: number) => void;
  handleMetadataLoaded?: (duration: number) => void;
  handleEnded?: () => void;
  handleError?: (errorCode: string) => void;
  setLoadingState?: (isLoading: boolean) => void;
}

export function setupEventListeners(
  audioElement: HTMLAudioElement,
  store: AudioPlayerStore
): void {
  if (!audioElement) return;

  // Default to being the primary source unless specified otherwise
  audioElement._isPrimarySource = true;

  // Only add event listeners if they don't already exist
  const timeUpdateHandler: EventListener = () => {
    // Only update time if this is the primary audio source
    if (audioElement._isPrimarySource) {
      store.handleTimeUpdate?.(audioElement.currentTime);
    }
  };

  const metadataLoadedHandler: EventListener = () => {
    // Only update metadata if this is the primary audio source
    if (audioElement._isPrimarySource) {
      store.handleMetadataLoaded?.(audioElement.duration);
    }
  };

  const endedHandler: EventListener = () => {
    store.handleEnded?.();
  };

  const errorHandler: EventListener = (event: Event) => {
    const errorCode =
      (event.target as HTMLAudioElement)?.error?.code || "unknown";
    store.handleError?.(`${errorCode}`);
  };

  const waitingHandler: EventListener = () => {
    if (audioElement._isPrimarySource) {
      store.setLoadingState?.(true);
    }
  };

  const canPlayHandler: EventListener = () => {
    if (audioElement._isPrimarySource) {
      store.setLoadingState?.(false);
    }
  };

  // Add event listeners
  audioElement.addEventListener("timeupdate", timeUpdateHandler);
  audioElement.addEventListener("loadedmetadata", metadataLoadedHandler);
  audioElement.addEventListener("ended", endedHandler);
  audioElement.addEventListener("error", errorHandler);
  audioElement.addEventListener("waiting", waitingHandler);
  audioElement.addEventListener("canplay", canPlayHandler);

  // Store the event handlers on the element for later removal if needed
  audioElement._playerHandlers = {
    timeUpdate: timeUpdateHandler,
    metadataLoaded: metadataLoadedHandler,
    ended: endedHandler,
    error: errorHandler,
    waiting: waitingHandler,
    canPlay: canPlayHandler,
  };
}

/**
 * Clean up event listeners from an audio element
 * @param audioElement The audio element to clean up
 */
export function cleanupEventListeners(audioElement: HTMLAudioElement): void {
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
  audioElement.removeEventListener("ended", audioElement._playerHandlers.ended);
  audioElement.removeEventListener("error", audioElement._playerHandlers.error);
  audioElement.removeEventListener(
    "waiting",
    audioElement._playerHandlers.waiting
  );
  audioElement.removeEventListener(
    "canplay",
    audioElement._playerHandlers.canPlay
  );

  // Delete the reference to handlers
  delete audioElement._playerHandlers;
  delete audioElement._isPrimarySource;
}

// Add TypeScript declaration for audio element with handlers
declare global {
  interface HTMLAudioElement {
    _playerHandlers?: {
      timeUpdate: EventListener;
      metadataLoaded: EventListener;
      ended: EventListener;
      error: EventListener;
      waiting: EventListener;
      canPlay: EventListener;
    };
    _isPrimarySource?: boolean; // Flag to determine if this audio element should update UI
  }
}
