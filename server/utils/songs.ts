function sanitizeArtist(a: string): string {
  let sanitized = a;
  if (sanitized.indexOf("(") > -1 && sanitized.indexOf(")") < 0) {
    sanitized = sanitized.replace("(", "");
  } else if (sanitized.indexOf(")") > -1 && sanitized.indexOf("(") < 0) {
    sanitized = sanitized.replace(")", "");
  }
  if (sanitized.indexOf("[") > -1 && sanitized.indexOf("]") < 0) {
    sanitized = sanitized.replace("[", "");
  } else if (sanitized.indexOf("]") > -1 && sanitized.indexOf("[") < 0) {
    sanitized = sanitized.replace("]", "");
  }
  return sanitized.trim();
}

interface SongDocument {
  artist: string;
  title: string;
}

interface TokenizedSongResult {
  title: string;
  artists: string[];
}

export function tokenizeSong(doc: SongDocument): TokenizedSongResult {
  const featuringSeparator = [
    "Featuring ",
    "featuring ",
    "Feat.",
    "feat.",
    "Feat ",
    "feat ",
    "Ft.",
    "ft.",
    "Ft ",
    "ft ",
    "F/",
    "f/",
  ];
  let finalArtists: string[] = [];
  let realTitle = doc.title;

  // Process artists from the artist field
  for (const separator of featuringSeparator) {
    const spl = doc.artist.split(separator, 2);
    if (spl.length === 2) {
      let artists = spl[1].split(",");
      const lastArtist = artists.pop();
      if (lastArtist) {
        artists = artists.concat(lastArtist.split(/ And | & /));
      }
      finalArtists = [sanitizeArtist(spl[0]), ...artists.map(sanitizeArtist)];
      break;
    }
  }
  if (!finalArtists.length) {
    finalArtists.push(sanitizeArtist(doc.artist));
  }

  // Process featured artists from the title field
  for (const separator of featuringSeparator) {
    const spl = doc.title.split(separator, 2);
    if (spl.length === 2) {
      realTitle = spl[0].trimEnd();
      const artists = spl[1].split(",");
      let lastItem = artists.pop();

      if (lastItem) {
        if (lastItem.endsWith("]") && lastItem.indexOf("[") === -1) {
          lastItem = lastItem.slice(0, -1);
          if (realTitle.endsWith("[")) {
            realTitle = realTitle.slice(0, -1);
          } else {
            realTitle += "]";
          }
        } else if (lastItem.endsWith(")") && lastItem.indexOf("(") === -1) {
          lastItem = lastItem.slice(0, -1);
          if (realTitle.endsWith("(")) {
            realTitle = realTitle.slice(0, -1);
          } else {
            realTitle += ")";
          }
        }

        lastItem.split(/ And | & /).forEach((v) => {
          const sanitizedArtist = sanitizeArtist(v);
          if (!finalArtists.includes(sanitizedArtist)) {
            finalArtists.push(sanitizedArtist);
          }
        });
      }
      break;
    }
  }

  // Remove duplicates
  const uniqueArtists: string[] = [];
  for (const artist of finalArtists) {
    if (!uniqueArtists.includes(artist)) {
      uniqueArtists.push(artist);
    }
  }

  return { title: realTitle, artists: uniqueArtists };
}
