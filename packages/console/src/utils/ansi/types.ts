import type Anser from "anser";

/** One token produced by Anser's ANSI parser. */
export type AnserToken = ReturnType<typeof Anser.ansiToJson>[number];

/** An ANSI token plus its start/end offsets in ANSI-stripped text. */
export interface AnsiTokenRange {
  /** Parsed Anser token. */
  token: AnserToken;
  /** Inclusive source offset in visible text. */
  start: number;
  /** Exclusive source offset in visible text. */
  end: number;
}
