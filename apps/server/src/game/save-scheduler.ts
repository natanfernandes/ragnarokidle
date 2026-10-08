/**
 * Coalesces saves of one character. Routine progress is written at most once
 * per interval; important changes are written at once. Saves never overlap
 * and always write the latest state.
 *
 * Losing the last interval in a crash costs nothing: the saved combat state
 * holds the RNG, so catching up from it replays exactly the same fights.
 */
export class SaveScheduler {
  private timer: NodeJS.Timeout | null = null;
  private dirty = false;
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly save: () => Promise<void>,
    private readonly intervalMs: number,
    private readonly onError: (error: unknown) => void,
  ) {}

  request(options: { immediate?: boolean } = {}): void {
    this.dirty = true;
    if (options.immediate) void this.flush();
    else this.timer ??= setTimeout(() => void this.flush(), this.intervalMs);
  }

  /** Writes pending changes now; resolves once everything requested so far is saved. */
  flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.dirty) {
      this.dirty = false;
      this.chain = this.chain.then(this.save).catch((error: unknown) => {
        // Keep the changes pending so the next save retries them.
        this.dirty = true;
        this.onError(error);
      });
    }
    return this.chain;
  }
}
