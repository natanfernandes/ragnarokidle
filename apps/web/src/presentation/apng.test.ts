import { describe, expect, it } from 'vitest';
import { apngDurationMs } from './apng';

function chunk(type: string, data: number[]): number[] {
  const length = [0, 0, 0, data.length];
  return [...length, ...[...type].map((c) => c.charCodeAt(0)), ...data, 0, 0, 0, 0];
}

function fcTL(delayNum: number, delayDen: number): number[] {
  const data = new Array<number>(26).fill(0);
  data[20] = delayNum >> 8;
  data[21] = delayNum & 0xff;
  data[22] = delayDen >> 8;
  data[23] = delayDen & 0xff;
  return chunk('fcTL', data);
}

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const png = (...chunks: number[][]) => new Uint8Array([...signature, ...chunks.flat()]);

describe('apngDurationMs', () => {
  it('sums the frame delays', () => {
    expect(apngDurationMs(png(fcTL(1, 10), fcTL(150, 1000), fcTL(3, 0), chunk('IEND', [])))).toBe(
      280,
    );
  });

  it('returns null for still images and non-PNG data', () => {
    expect(apngDurationMs(png(chunk('IEND', [])))).toBeNull();
    expect(apngDurationMs(png(fcTL(1, 10), chunk('IEND', [])))).toBeNull();
    expect(apngDurationMs(new TextEncoder().encode('<!doctype html>'))).toBeNull();
  });
});
