function uid() {
  return `${(0x100000000 * Math.random()).toString(32)}${(
    0x100000000 * Math.random()
  ).toString(32)}${(0x100000000 * Math.random()).toString(32)}`.replace(
    /\./g,
    ""
  );
}

export function getSongUUID() {
  return `aa${uid()}`;
}

export function getImageUUID() {
  return uid();
}
