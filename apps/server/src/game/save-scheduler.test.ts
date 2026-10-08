import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveScheduler } from './save-scheduler';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SaveScheduler', () => {
  it('coalesces routine saves into one per interval', async () => {
    const save = vi.fn(async () => {});
    const saves = new SaveScheduler(save, 5000, () => {});
    saves.request();
    saves.request();
    saves.request();
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves immediately when asked and on flush', async () => {
    const save = vi.fn(async () => {});
    const saves = new SaveScheduler(save, 5000, () => {});
    saves.request({ immediate: true });
    await saves.flush();
    expect(save).toHaveBeenCalledTimes(1);
    saves.request();
    await saves.flush();
    expect(save).toHaveBeenCalledTimes(2);
    await saves.flush();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('never overlaps saves', async () => {
    let running = 0;
    let overlapped = false;
    const save = async () => {
      running += 1;
      overlapped ||= running > 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      running -= 1;
    };
    const saves = new SaveScheduler(save, 5000, () => {});
    saves.request({ immediate: true });
    saves.request({ immediate: true });
    const done = saves.flush();
    await vi.advanceTimersByTimeAsync(300);
    await done;
    expect(overlapped).toBe(false);
  });

  it('reports failures and retries them on the next save', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValue(undefined);
    const onError = vi.fn();
    const saves = new SaveScheduler(save, 5000, onError);
    saves.request({ immediate: true });
    await saves.flush();
    expect(onError).toHaveBeenCalledTimes(1);
    await saves.flush();
    expect(save).toHaveBeenCalledTimes(2);
  });
});
