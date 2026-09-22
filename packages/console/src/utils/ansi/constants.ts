/** ASCII escape character used to begin ANSI control sequences. */
export const ANSI_ESCAPE = String.fromCharCode(27);

const ANSI_CLEAR_LINE_SOURCE = `${ANSI_ESCAPE}\\[[012]?K`;

/** Matches ANSI erase-in-line controls used by redraw/progress output. */
export const ANSI_CLEAR_LINE_PATTERN = new RegExp(ANSI_CLEAR_LINE_SOURCE);

/** Matches an ANSI erase-in-line control only at the start of a chunk. */
export const ANSI_CLEAR_LINE_PREFIX_PATTERN = new RegExp(
  `^${ANSI_CLEAR_LINE_SOURCE}`,
);
