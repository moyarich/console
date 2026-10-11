/** Notifies mounted entry wrappers when an earlier entry completes. */
export class AnimationSequence {
  private listeners = new Set<() => void>();
  private finished = new Set<number>();
  private next = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.next;
  complete(index: number) {
    if (this.finished.has(index)) return;
    this.finished.add(index);
    while (this.finished.has(this.next)) this.next++;
    for (const listener of this.listeners) listener();
  }
  clear() {
    this.finished.clear();
    this.listeners.clear();
  }
}

