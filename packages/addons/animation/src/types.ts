export type ConsoleAnimationEffect =
  "fade" | "slide" | "fade-slide" | "reveal" | "typewriter";
export interface ConsoleAnimationOptions {
  effect?: ConsoleAnimationEffect;
  /** Duration in seconds. */
  duration?: number;
  /** Delay between successive entries, in seconds. */
  stagger?: number;
  /** Initial wait, in seconds. */
  wait?: number;
  /** Start each entry only when the previous entry has finished. */
  sequence?: boolean;
  /** Vertical slide distance, in pixels. */
  distance?: number;
}
