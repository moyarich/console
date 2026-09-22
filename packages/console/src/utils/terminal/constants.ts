/** ASCII escape character used to begin ANSI control sequences. */
export const ANSI_ESCAPE = String.fromCharCode(27);

/** Matches ANSI erase-in-line controls used by redraw/progress output. */
export const ANSI_CLEAR_LINE_PATTERN = new RegExp(
  `${ANSI_ESCAPE}\\[[012]?K`,
);
