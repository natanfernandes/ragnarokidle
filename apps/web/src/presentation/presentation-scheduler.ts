import type { CombatEvent } from '@ragidle/shared';

/**
 * Plays authoritative events back on a local timeline. Simulation time is
 * mapped to local time via the server clock offset, plus a small buffer so
 * that events arriving in the same batch still play out with their spacing.
 */
export const PRESENTATION_DELAY_MS = 350;
/** If playback falls this far behind (e.g. a background tab), skip ahead. */
export const MAX_BACKLOG_MS = 5_000;

export class PresentationScheduler {
  private queue: CombatEvent[] = [];
  private clockOffset: number | null = null;
  private frame: number | null = null;

  constructor(private readonly play: (event: CombatEvent, options: { animate: boolean }) => void) {}

  /** Queues events received from the server at `serverTime`. */
  push(serverTime: number, events: CombatEvent[]): void {
    const offset = Date.now() - serverTime;
    // Keep the smallest observed offset: it is the one with the least network delay.
    this.clockOffset = this.clockOffset === null ? offset : Math.min(this.clockOffset, offset);
    this.queue.push(...events);
    this.ensureRunning();
  }

  /**
   * Drops queued events already covered by an authoritative snapshot and
   * returns them, so callers can still log them.
   */
  discardUntil(serverTime: number): CombatEvent[] {
    const covered = this.queue.filter((e) => e.timestamp <= serverTime);
    this.queue = this.queue.filter((e) => e.timestamp > serverTime);
    return covered;
  }

  stop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  reset(): void {
    this.queue = [];
    this.clockOffset = null;
  }

  private ensureRunning(): void {
    if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = () => {
    this.frame = null;
    const offset = this.clockOffset ?? 0;
    const playhead = Date.now() - offset - PRESENTATION_DELAY_MS;

    while (this.queue.length > 0) {
      const next = this.queue[0]!;
      if (next.timestamp > playhead) break;
      this.queue.shift();
      this.play(next, { animate: playhead - next.timestamp < MAX_BACKLOG_MS });
    }
    if (this.queue.length > 0) this.ensureRunning();
  };
}
