/**
 * Grid positions, as in Ragnarok Online: x grows east, y grows north, and
 * distances are measured in cells (Chebyshev distance, diagonals count as 1).
 */
export interface GridPosition {
  x: number;
  y: number;
}

/** A straight walk between two cells. Times are simulation epoch ms. */
export interface Movement {
  from: GridPosition;
  to: GridPosition;
  startAt: number;
  arriveAt: number;
}

/** Walking one cell diagonally takes this much longer than a straight step. */
export const DIAGONAL_STEP_COST = 1.4;

export function cellDistance(a: GridPosition, b: GridPosition): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** Time to walk from one cell to another at `msPerCell`. */
export function walkDurationMs(from: GridPosition, to: GridPosition, msPerCell: number): number {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const diagonal = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diagonal;
  return Math.round(msPerCell * (straight + diagonal * DIAGONAL_STEP_COST));
}

/**
 * The cell where a walker heading straight for `target` first gets within
 * `range` cells of it. Returns `from` when it is already in range. Open maps
 * need no pathfinding: the walker always moves along the straight line.
 */
export function approachCell(
  from: GridPosition,
  target: GridPosition,
  range: number,
): GridPosition {
  const distance = cellDistance(from, target);
  if (distance <= range) return { ...from };
  const t = (distance - range) / distance;
  const cell = {
    x: Math.round(from.x + (target.x - from.x) * t),
    y: Math.round(from.y + (target.y - from.y) * t),
  };
  // Rounding can leave the walker one cell short; step closer if so.
  while (cellDistance(cell, target) > range) {
    cell.x += Math.sign(target.x - cell.x);
    cell.y += Math.sign(target.y - cell.y);
  }
  return cell;
}

/** Where a walker is at `time`, interpolated along its movement. */
export function positionAt(movement: Movement, time: number): GridPosition {
  const span = movement.arriveAt - movement.startAt;
  const t = span <= 0 ? 1 : Math.min(1, Math.max(0, (time - movement.startAt) / span));
  return {
    x: movement.from.x + (movement.to.x - movement.from.x) * t,
    y: movement.from.y + (movement.to.y - movement.from.y) * t,
  };
}

/**
 * Ragnarok Online direction (0 south, 1 south-west, ... 6 east, 7 south-east)
 * for an actor at `from` looking at `to`. Returns `fallback` when both are
 * the same cell.
 */
export function facingDirection(from: GridPosition, to: GridPosition, fallback = 0): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return fallback;
  // Octant counter-clockwise from east: 0 east, 2 north, 4 west, 6 south.
  const octant = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
  return (6 - octant + 8) % 8;
}
