import { describe, expect, it } from 'vitest';
import {
  approachCell,
  cellDistance,
  facingDirection,
  positionAt,
  walkDurationMs,
} from './position';

describe('grid positions', () => {
  it('measures distance in cells, diagonals included', () => {
    expect(cellDistance({ x: 0, y: 0 }, { x: 3, y: 5 })).toBe(5);
  });

  it('charges diagonal steps a bit more than straight ones', () => {
    expect(walkDurationMs({ x: 0, y: 0 }, { x: 4, y: 0 }, 150)).toBe(600);
    expect(walkDurationMs({ x: 0, y: 0 }, { x: 2, y: 4 }, 100)).toBe(480);
  });

  it('stops a walker just within range of its target', () => {
    const from = { x: 0, y: 0 };
    const target = { x: 7, y: 3 };
    const cell = approachCell(from, target, 1);
    expect(cellDistance(cell, target)).toBe(1);
    expect(approachCell({ x: 6, y: 3 }, target, 1)).toEqual({ x: 6, y: 3 });
    expect(cellDistance(approachCell(from, target, 4), target)).toBe(4);
  });

  it('interpolates a movement over time', () => {
    const movement = { from: { x: 0, y: 0 }, to: { x: 4, y: 2 }, startAt: 1000, arriveAt: 2000 };
    expect(positionAt(movement, 500)).toEqual({ x: 0, y: 0 });
    expect(positionAt(movement, 1500)).toEqual({ x: 2, y: 1 });
    expect(positionAt(movement, 9000)).toEqual({ x: 4, y: 2 });
  });

  it('maps a heading to Ragnarok Online directions', () => {
    const o = { x: 5, y: 5 };
    const at = (x: number, y: number) => facingDirection(o, { x: 5 + x, y: 5 + y });
    expect([at(0, -1), at(-1, -1), at(-1, 0), at(-1, 1)]).toEqual([0, 1, 2, 3]);
    expect([at(0, 1), at(1, 1), at(1, 0), at(1, -1)]).toEqual([4, 5, 6, 7]);
    expect(facingDirection(o, o, 7)).toBe(7);
  });
});
