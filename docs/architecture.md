# Architecture

## Combat engine (`packages/combat-engine`)

The engine is event-driven and time-agnostic. `CombatState` holds the next
scheduled time for every actor (player action, monster action, next spawn,
respawn, regen). `advanceCombat(state, until)` repeatedly processes the earliest
scheduled action until nothing is due before `until`, and returns a new state
plus the `CombatEvent`s produced. It never mutates its input.

Key properties, all covered by tests:

- **Deterministic.** All randomness comes from a seeded mulberry32 RNG whose
  state lives in `CombatState.rngState`. Same seed, same events.
- **Step-independent.** Advancing in many small steps yields exactly the same
  events and final state as advancing once. This is what lets the server
  advance lazily, and what makes offline progression equal to online play.
- **Pure.** ESLint forbids `Math.random`, `Date.now`, timers and `process`
  inside the engine.

### Movement

Fields are grids, as in Ragnarok Online: x grows east, y grows north, and
distance is counted in cells with diagonals as one (`packages/shared/src/position.ts`).
Monsters appear a few cells from the player (`SPAWN_DISTANCE`), drifting back
towards the middle of the field. Then one side walks to the other:

- Passive monsters wait; the player walks until within its `attackRange`.
- Aggressive monsters (`aggroRange` set) charge a player they can see and
  strike on arrival.
- A side still out of range after that (a melee monster facing a ranged
  attacker) closes in too.

A walk is a straight line and a single `move` event with `from`, `to` and
`arriveAt`; the engine never steps cell by cell. Its cost is the same for any
distance, so offline simulation stays cheap. Diagonal steps cost 1.4 cells of
`moveSpeedMs`. Open fields need no pathfinding; when maps get obstacles, a
small walkable grid with A* only for blocked straight lines can slot into
`approachCell`.

`simulateCombat(input)` wraps this for one-shot runs (tests, balance tool).

Formulas live in `formulas.ts` and are placeholders to be tuned with
`pnpm simulate`.

## Server (`apps/server`)

- `CombatSession` owns one character's combat. While a client is connected, a
  single `setTimeout` fires at the next scheduled action (no polling loop),
  advances the engine to "now", and broadcasts the events.
- When the last client disconnects, the timer stops. On reconnect, the elapsed
  time is simulated in one call (`recordEvents: false`) and summarized as an
  `offline.rewards` message. Rewards are part of the state, so reconnecting
  never duplicates them. The simulated time is capped by `MAX_OFFLINE_HOURS`.
- Every client message is validated with zod (`packages/protocol`), rate
  limited, and checked against game rules (`GameRuleError`).
- Authentication is a development stub: the token `dev:<name>` maps to a
  character. Characters are stored in memory behind `CharacterRepository`.

## Web (`apps/web`)

- `GameClient` connects, authenticates, and reconnects with backoff. After a
  reconnect the server sends the authoritative snapshot.
- `PresentationScheduler` replays events on a local timeline: simulation time
  is mapped through the server clock offset plus a small buffer, so batched
  events keep their original spacing. Far-behind backlogs are applied without
  animation.
- `useGameStore` (Zustand) holds presentation state only: values copied from
  snapshots or replayed from events. It never computes outcomes.
- Panels are built from the `@ragidle/ui` design system. See
  [design-system.md](design-system.md).
- `CombatStage` draws the field in a three-quarter view. Actors are placed by
  cell, in percentages of the field, and a `move` becomes one CSS transition
  over its duration, with the walk animation and the direction from the
  heading. Blows turn both sides to face each other.
- Sprites come from the renderer service through the game server, with SVG
  placeholders as a fallback. See [renderer.md](renderer.md).

## Not done yet (by design, see spec section 78)

1. PostgreSQL + Drizzle behind `CharacterRepository`
2. Batched / statistical offline simulation for very long absences
3. Real authentication
4. Equipment changes, stat allocation, more content
5. Target selection modes (only single encounters exist so far)
