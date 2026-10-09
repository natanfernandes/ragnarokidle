# Ragnarok Idle — Software Design Specification

> **Status:** Draft / Prototype  
> **Document type:** Product + Technical Specification  
> **Target:** Web idle RPG inspired by Ragnarok Online  
> **Primary goal:** Build a small, extensible idle combat game where the player configures a character and lets the server simulate combat while the client presents the combat visually.

---

## 1. Executive Summary

Ragnarok Idle is a web-based idle RPG inspired by the progression, classes, monsters, equipment, skills, maps, drops, and visual language of Ragnarok Online.

The core experience is:

1. Create or load a character.
2. Choose a map.
3. Configure a combat strategy.
4. Start automatic combat.
5. The server simulates combat authoritatively.
6. The client renders combat events and character/monster sprites.
7. The player receives XP, Zeny, equipment, consumables, cards, and other drops.
8. When the player leaves the game, progress continues through offline simulation.
9. The player returns, collects progress, changes strategy, improves equipment, and chooses the next farming target.

The game is intentionally **not a full MMORPG**.

The server should simulate the important game state and combat decisions, but it should not simulate a fully navigable real-time world. The client is primarily a presentation layer.

### Core architectural principle

> **The server simulates the game. The client presents the result.**

This allows the project to provide an authentic-feeling RO-like combat loop without implementing real-time movement synchronization, client prediction, reconciliation, complex collision, or a persistent MMO world.

---

# 2. Product Vision

## 2.1 Player fantasy

The player should feel like they are building and managing an automated Ragnarok-style adventurer.

The game should answer:

> "How do I configure my character to farm this monster/map as efficiently as possible?"

rather than:

> "How do I manually control my character every second?"

The interesting decisions should come from:

- Character build
- Equipment
- Skills
- Skill priorities
- Potion thresholds
- Target selection
- Loot filters
- Map selection
- Farming efficiency
- Risk/reward
- Progression

---

# 3. Design Pillars

## 3.1 Idle first

Combat must work without constant user interaction.

The player can configure a strategy and leave.

## 3.2 Server authoritative

All meaningful game state is calculated on the server.

The client must never be trusted to determine:

- Damage
- XP
- Drops
- Zeny
- Item ownership
- Level
- Character stats
- Skill cooldowns
- Combat outcomes

## 3.3 Visually dynamic, mechanically discrete

The server does not need to simulate every animation frame.

The server produces semantic combat events such as:

```text
attack
skill_cast
damage
critical
miss
monster_death
loot
level_up
```

The client turns those events into:

```text
attack animation
hit animation
damage numbers
particles
sound
death animation
loot animation
UI updates
```

This creates a dynamic presentation without requiring a real-time MMO simulation.

## 3.4 RO-inspired, not RO-complete

The initial game should use familiar concepts:

- STR / AGI / VIT / INT / DEX / LUK
- Classes
- Weapons
- Armor
- Skills
- Elements
- Monsters
- Maps
- Drops
- Cards
- Zeny
- Experience

However, formulas do not need to reproduce Ragnarok Online 1:1.

The first version should prioritize:

- Fun
- Predictability
- Balance
- Extensibility
- Easy testing

---

# 4. Scope

## 4.1 MVP

The MVP must contain:

### Character

- One playable class: Swordman
- Level progression
- Base stats
- HP
- SP
- ATK
- DEF
- ASPD / attack interval
- Basic equipment

### Monsters

At least:

- Poring
- Fabre
- Lunatic

Each monster has:

- HP
- ATK
- DEF
- ASPD
- XP
- Zeny reward
- Drop table

### Map

One map:

- Prontera Field

The map contains weighted monster spawn definitions.

### Combat

- Auto attack
- Basic target selection
- Damage calculation
- Critical hit
- Miss
- Monster death
- Player death
- Respawn
- XP
- Zeny
- Drops

### Skill

At least:

- Bash

The skill must support:

- SP cost
- Cooldown
- Priority
- Damage multiplier
- Minimum SP condition

### Potions

At least:

- Red Potion
- Blue Potion

Configuration:

```text
Use Red Potion when HP < X%
Use Blue Potion when SP < X%
```

### Loot

- Automatic loot
- Loot filter
- Item inventory
- Basic item categories

### Combat configuration

Player can configure:

- Target priority
- Enabled skills
- Skill priority
- Potion thresholds
- Loot filters

### Visual presentation

- Character sprite
- Monster sprite
- Idle animation
- Attack animation
- Hit animation
- Death animation
- Damage numbers
- Combat log
- HP/SP bars

### Offline progression

The player must receive progress after returning to the game.

---

# 5. Non-Goals for MVP

Do NOT implement:

- Multiplayer combat
- Parties
- Guilds
- PvP
- Trading
- Market
- Real-time player movement
- Open-world navigation
- Collision
- Pathfinding
- Client prediction
- Reconciliation
- Full RO formulas
- Every RO class
- Every RO map
- Every RO monster
- Crafting
- Quests
- Social systems
- Mobile application
- Payments

These should only be considered after the core idle loop is proven.

---

# 6. Recommended Technology Stack

## 6.1 Frontend

Recommended:

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- Native WebSocket client
- CSS / Tailwind / component library as desired

### Why Vite?

SSR is not important for the core game.

The application is primarily:

- Interactive
- Authenticated
- Stateful
- Client-rendered
- WebSocket-driven

Vite keeps the frontend architecture simpler.

Next.js can be introduced later if the project needs:

- Public landing pages
- SEO
- Content pages
- Server-side authentication flows
- Marketing pages

The game itself should remain conceptually independent of Next.js.

---

# 7. Backend

Recommended:

- Node.js
- TypeScript
- Fastify
- WebSocket
- PostgreSQL
- Drizzle ORM

Potential future infrastructure:

- Redis
- Queue system
- Object storage
- CDN

---

# 8. Renderer

Primary candidate:

- zrenderer

Repository:

https://github.com/zhad3/zrenderer

Potential alternative:

- ragassets

The renderer should be treated as an **asset/rendering service**, not as part of the combat simulation.

---

# 9. High-Level Architecture

```text
                        ┌──────────────────────┐
                        │      React Web        │
                        │                      │
                        │ UI                   │
                        │ Combat View          │
                        │ Character View       │
                        │ Configuration        │
                        │ Inventory            │
                        └──────────┬───────────┘
                                   │
                             HTTPS / WS
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │     Game Server      │
                        │                      │
                        │ Fastify              │
                        │ Authentication       │
                        │ WebSocket            │
                        │ Character State      │
                        │ Inventory            │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Combat Engine      │
                        │                      │
                        │ Simulation           │
                        │ Stats                │
                        │ Skills               │
                        │ Damage               │
                        │ Drops                │
                        │ XP                   │
                        │ Offline simulation   │
                        └──────────┬───────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
             ┌────────────────┐          ┌────────────────┐
             │   PostgreSQL   │          │ Asset Renderer │
             │                │          │                │
             │ Characters     │          │ zrenderer      │
             │ Items          │          │ / ragassets    │
             │ Inventory      │          │                │
             │ Progress       │          └───────┬────────┘
             └────────────────┘                  │
                                                 ▼
                                          RO-like Assets
```

---

# 10. Repository Structure

Recommended monorepo:

```text
ragnarok-idle/
├── apps/
│   ├── web/
│   └── server/
│
├── packages/
│   ├── combat-engine/
│   ├── game-data/
│   ├── protocol/
│   ├── shared/
│   └── renderer-client/
│
├── tooling/
│
├── docs/
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 10.1 `apps/web`

Responsible for:

- React application
- UI
- WebSocket connection
- State presentation
- Combat animations
- Character rendering
- Configuration screens

It must NOT calculate authoritative combat outcomes.

## 10.2 `apps/server`

Responsible for:

- HTTP API
- WebSocket server
- Authentication
- Persistence
- Game sessions
- Combat orchestration

## 10.3 `packages/combat-engine`

Pure game simulation.

Should ideally have no:

- React
- Fastify
- WebSocket
- Database
- Browser APIs

This package should be deterministic and highly testable.

## 10.4 `packages/game-data`

Static game definitions:

```text
classes
skills
monsters
items
maps
drops
equipment
elements
```

## 10.5 `packages/protocol`

Shared WebSocket and API types.

## 10.6 `packages/shared`

Generic shared types and utilities.

---

# 11. Combat Architecture

## 11.1 Combat loop

The combat engine is event-driven.

```text
Combat State
     │
     ▼
Determine next action
     │
     ├── Attack
     ├── Skill
     ├── Potion
     └── Wait
     │
     ▼
Calculate result
     │
     ▼
Apply state changes
     │
     ▼
Generate events
     │
     ▼
Schedule next action
```

---

# 12. Simulation Model

Do not run a permanent simulation loop per player.

Avoid:

```ts
while (combatIsRunning) {
  await sleep(500);
  attack();
}
```

Instead, represent future actions using timestamps.

Example:

```ts
interface CombatActorState {
  nextActionAt: number;
}
```

A simulation can process events:

```text
12:00:00.000 attack
12:00:00.650 attack
12:00:01.300 skill
12:00:02.000 attack
```

The server can process only the relevant simulation window.

---

# 13. Simulation API

The combat engine should expose a deterministic API similar to:

```ts
interface SimulationInput {
  character: CharacterState;
  config: CombatConfig;
  encounter: EncounterState;
  durationMs: number;
  seed?: number;
}

interface SimulationResult {
  finalState: CombatState;
  events: CombatEvent[];
  rewards: Reward[];
  statistics: SimulationStatistics;
}
```

Example:

```ts
const result = simulateCombat({
  character,
  config,
  encounter,
  durationMs: 60_000,
  seed: 1234,
});
```

---

# 14. Combat Configuration

```ts
interface CombatConfig {
  targetMode:
    | 'nearest'
    | 'lowest_hp'
    | 'highest_xp'
    | 'specific';

  targetMonsterId?: string;

  skills: SkillStrategy[];

  potions: PotionStrategy;

  loot: LootStrategy;

  flee?: FleeStrategy;
}
```

## Skill strategy

```ts
interface SkillStrategy {
  skillId: string;
  enabled: boolean;
  priority: number;

  conditions?: {
    minHpPercent?: number;
    maxHpPercent?: number;
    minSpPercent?: number;
    minTargets?: number;
  };
}
```

---

# 15. Combat Events

Core event types:

```ts
type CombatEvent =
  | AttackEvent
  | SkillCastEvent
  | DamageEvent
  | MissEvent
  | CriticalEvent
  | PotionUsedEvent
  | MonsterDeathEvent
  | PlayerDeathEvent
  | LootEvent
  | ExperienceEvent
  | LevelUpEvent;
```

Example:

```ts
interface DamageEvent {
  type: 'damage';
  timestamp: number;
  attackerId: string;
  targetId: string;
  amount: number;
  damageType: 'physical' | 'magical' | 'true';
}
```

---

# 16. Client Presentation

The client should not directly render every server tick.

Instead:

```text
Server event
     │
     ▼
Event buffer
     │
     ▼
Presentation scheduler
     │
     ├── Character animation
     ├── Monster animation
     ├── Damage number
     ├── VFX
     └── Sound
```

This allows the server to process combat quickly while the client presents it at a comfortable speed.

---

# 17. Simulation Time vs Presentation Time

These are separate concepts.

## Simulation time

Authoritative.

Example:

```text
Player attacks at T=1000
Monster dies at T=2200
```

## Presentation time

Visual.

Example:

```text
Attack animation: 600ms
Hit effect: 100ms
Damage number: 900ms
Death animation: 1000ms
```

The presentation may be slightly slower, faster, or compressed without changing the actual game state.

---

# 18. Offline Progression

Offline progression is a first-class feature.

Character state should include:

```ts
lastSimulationAt: Date;
```

When the player returns:

```text
currentTime - lastSimulationAt
        │
        ▼
offline duration
        │
        ▼
combat simulation
        │
        ▼
rewards + updated state
```

Example:

```text
Last active:
10:00

Return:
18:00

Offline:
8 hours

Result:
+42,120 XP
+12,450 Zeny
+82 items
+1 level
```

---

# 19. Offline Simulation Safety

Do not blindly simulate millions of individual events.

Use a hybrid strategy.

For short periods:

```text
Exact event simulation
```

For long periods:

```text
Aggregated combat simulation
```

Potential implementation:

```text
< 5 minutes:
  detailed event simulation

5 minutes - 6 hours:
  batched simulation

> 6 hours:
  statistical / cycle-based simulation
```

The exact thresholds should be configurable.

---

# 20. Combat Formulas

The formulas should be RO-inspired but simplified.

## Base attack

Example:

```text
ATK =
  baseAttack
  + STR * 2
  + weaponAttack
  + level * 0.5
```

## Physical damage

```text
rawDamage =
  ATK
  * skillMultiplier
  * elementMultiplier
  * raceMultiplier
```

## Defense

```text
finalDamage =
  max(1, rawDamage - target.DEF)
```

## Critical

```text
criticalDamage =
  baseDamage * criticalMultiplier
```

These formulas are placeholders and must be balanced through simulation.

---

# 21. Character Stats

Initial stats:

```text
STR
AGI
VIT
INT
DEX
LUK
```

Derived stats:

```text
HP
SP
ATK
MATK
DEF
MDEF
HIT
FLEE
CRIT
ASPD
```

MVP may expose only a subset in the UI.

---

# 22. Character Model

Example:

```ts
interface Character {
  id: string;
  accountId: string;

  name: string;
  classId: string;

  level: number;
  experience: number;

  baseStats: Stats;

  hp: number;
  sp: number;

  equipment: EquipmentState;

  inventory: InventoryState;

  combatConfig: CombatConfig;

  currentMapId: string;

  lastSimulationAt: Date;
}
```

---

# 23. Classes

MVP:

```text
Novice
Swordman
```

Recommended progression:

```text
Novice
  └── Swordman
       ├── Knight
       └── Crusader
```

Later:

```text
Mage
Archer
Acolyte
Thief
Merchant
```

---

# 24. Skills

MVP:

```text
Bash
```

Future:

```text
Swordman
  Bash
  Magnum Break
  Provoke
  Endure

Knight
  Bowling Bash
  Pierce
  Brandish Spear
  Two-Hand Quicken

Mage
  Fire Bolt
  Cold Bolt
  Lightning Bolt
  Fire Ball
```

Skills should be data-driven rather than hard-coded.

Example:

```ts
interface SkillDefinition {
  id: string;
  name: string;
  spCost: number;
  cooldownMs: number;

  targeting: 'single' | 'aoe';

  damage: {
    multiplier: number;
    statScaling: Record<string, number>;
  };
}
```

---

# 25. Monsters

MVP:

```text
Poring
Fabre
Lunatic
```

Example:

```ts
interface MonsterDefinition {
  id: string;
  name: string;

  level: number;

  hp: number;
  attack: number;
  defense: number;

  attackIntervalMs: number;

  experience: number;
  zeny: {
    min: number;
    max: number;
  };

  drops: DropDefinition[];

  sprite: SpriteDefinition;
}
```

---

# 26. Maps

A map is a farming environment, not necessarily a fully simulated world.

Example:

```ts
interface MapDefinition {
  id: string;
  name: string;

  monsters: {
    monsterId: string;
    weight: number;
  }[];

  encounterIntervalMs: {
    min: number;
    max: number;
  };
}
```

MVP:

```text
prontera_field
```

Future:

```text
prontera_field_01
prontera_field_02
payon_forest
payon_dungeon
geffen_field
morroc_field
```

---

# 27. Encounters

The server chooses a monster based on map weights.

Example:

```text
Prontera Field

Poring  50%
Fabre   30%
Lunatic 20%
```

An encounter creates:

```ts
interface EncounterState {
  id: string;
  mapId: string;
  monster: MonsterInstance;
}
```

---

# 28. Loot System

Loot should be deterministic from the server's RNG.

Example:

```ts
interface DropDefinition {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}
```

Potential future drop types:

```text
Consumable
Equipment
Material
Card
Currency
Quest item
```

---

# 29. Loot Filters

Players can configure:

```text
Always pickup:
  Cards
  Equipment

Pickup:
  Consumables

Ignore:
  Low-value materials
```

Future:

```text
Sell automatically
Dismantle automatically
Keep if rarity >= X
Keep if item has desirable stat
```

---

# 30. Equipment

MVP equipment slots:

```text
Weapon
Armor
Headgear
```

Future:

```text
Shield
Garment
Shoes
Accessory 1
Accessory 2
```

Equipment should be data-driven.

```ts
interface Equipment {
  id: string;
  itemId: string;

  refineLevel: number;

  stats: Record<string, number>;

  cards: string[];
}
```

---

# 31. Item Progression

Recommended long-term loop:

```text
Farm
  ↓
Get loot
  ↓
Equip useful items
  ↓
Sell unwanted items
  ↓
Get stronger
  ↓
Farm stronger monsters
  ↓
Unlock new map
  ↓
Repeat
```

---

# 32. Authentication

Authentication is NOT required for the first combat prototype, but should be introduced before persistent public accounts.

Recommended options:

- Email/password
- Google OAuth
- Discord OAuth
- GitHub OAuth

Recommended implementation:

```text
Browser
   ↓
Auth API
   ↓
Session / access token
   ↓
WebSocket authentication
```

The WebSocket connection must authenticate the user before receiving or mutating character state.

---

# 33. Account Model

```text
Account
 ├── id
 ├── email
 ├── createdAt
 └── settings

Account
 └── Characters
       ├── Character
       ├── Character
       └── Character
```

Future account features:

- Multiple characters
- Character slots
- Account-wide achievements
- Account settings
- Cosmetics

---

# 34. Database

Recommended PostgreSQL tables:

```text
accounts
sessions
characters
character_stats
character_equipment
inventory_items
items
skills
character_skills
combat_configs
maps
monsters
drops
combat_sessions
```

Static game data may remain in version-controlled TypeScript/JSON initially.

---

# 35. Persistence Strategy

Do not write every combat event to PostgreSQL.

Persist meaningful state changes:

```text
Character state
Inventory changes
Equipment changes
Level changes
Currency
Last simulation timestamp
Combat configuration
```

Combat logs should be transient unless analytics require persistence.

---

# 36. WebSocket Protocol

Connection:

```text
wss://api.example.com/game
```

Initial authentication:

```json
{
  "type": "authenticate",
  "token": "..."
}
```

Start combat:

```json
{
  "type": "combat.start",
  "mapId": "prontera_field"
}
```

Change configuration:

```json
{
  "type": "combat.config.update",
  "config": {}
}
```

Stop:

```json
{
  "type": "combat.stop"
}
```

Server event:

```json
{
  "type": "combat.event",
  "event": {
    "type": "damage",
    "attackerId": "player",
    "targetId": "poring",
    "amount": 124
  }
}
```

---

# 37. WebSocket Rules

The server must:

- Validate every message.
- Validate ownership of characters.
- Reject invalid state transitions.
- Never trust client-provided rewards.
- Rate-limit commands.
- Disconnect or throttle abusive clients.
- Handle reconnects gracefully.

The client should be able to reconnect without duplicating rewards.

---

# 38. Reconnection

Client flow:

```text
Connected
   │
   ▼
Disconnected
   │
   ▼
Reconnect
   │
   ▼
Authenticate
   │
   ▼
Request current state
   │
   ▼
Server returns authoritative state
```

The client should not attempt to reconstruct authoritative state from its previous local state.

---

# 39. Client State

Recommended Zustand stores:

```text
authStore
characterStore
combatStore
inventoryStore
uiStore
settingsStore
```

The server remains authoritative.

Zustand is for presentation and local UI state, not authority.

---

# 40. Rendering Architecture

Potential MVP:

```text
React
  │
  ├── UI
  │
  └── CombatStage
         │
         ├── PlayerSprite
         ├── MonsterSprite
         ├── DamageNumbers
         ├── VFX
         └── CombatEffects
```

The renderer should expose stable asset URLs or cached assets.

Example conceptual URL:

```text
/assets/render/player/{hash}/idle
/assets/render/player/{hash}/attack
/assets/render/monster/poring/idle
```

Exact renderer API should be isolated behind `renderer-client`.

---

# 41. Asset Caching

Do not render the same sprite repeatedly.

Cache:

```text
Character appearance + action
Monster + action
Item icon
Skill icon
```

Example cache key:

```text
player:
job=1
gender=male
head=1
headgear=4
weapon=2
action=attack
```

Hash this configuration.

```text
characterAppearanceHash
```

Use the hash as the asset cache key.

---

# 42. UI

## Main screen

```text
┌───────────────────────────────────────────────────────┐
│ Character             Resources                       │
│ Lv. 34 Swordman       12,450 Zeny                    │
│ HP █████████░         18 Red Potions                  │
│ SP ██████░░░          2 Blue Potions                 │
├───────────────────────────────────────────────────────┤
│                                                       │
│                 Combat Stage                          │
│                                                       │
│                  Monster                              │
│                    🟢                                 │
│                                                       │
│                        ⚔ Player                       │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Combat Log                         [Configure]        │
│ You dealt 124 damage                                    │
│ Critical hit: 342                                      │
│ Poring defeated                                        │
│ Obtained 1x Jellopy                                    │
└───────────────────────────────────────────────────────┘
```

---

# 43. Combat Configuration UI

```text
Target
  ○ Nearest
  ○ Lowest HP
  ○ Highest XP
  ○ Specific monster

Skills

  ☑ Bash
      Priority: 1
      Minimum SP: 20%

Potions

  HP < 40% → Red Potion
  SP < 20% → Blue Potion

Loot

  ☑ Equipment
  ☑ Cards
  ☑ Consumables
  ☐ Low-value materials
```

---

# 44. Combat Presets

Allow players to save strategies.

Examples:

```text
Poring Farm
Fast XP
Zeny Farm
Safe Farm
Card Hunt
AoE Farm
Boss Farm
```

Preset:

```ts
interface CombatPreset {
  id: string;
  name: string;
  config: CombatConfig;
}
```

---

# 45. MVP Development Plan

## Phase 0 — Project bootstrap

Tasks:

- Create monorepo
- Configure TypeScript
- Configure package manager
- Create web app
- Create server
- Create shared package
- Create game-data package
- Add linting
- Add formatting
- Add tests
- Add CI

Acceptance:

- Web starts
- Server starts
- Shared package imports from both
- Tests run in CI

---

# 46. Phase 1 — Combat Engine

Implement:

1. Character state
2. Monster state
3. Basic stats
4. Basic attack
5. Damage formula
6. Attack interval
7. Hit/miss
8. Critical
9. Death
10. XP
11. Zeny
12. Drops

Acceptance:

```text
A Swordman can kill a Poring deterministically.
```

Tests should verify exact results for seeded RNG.

---

# 47. Phase 2 — Combat Strategy

Implement:

- Target selection
- Bash
- Skill cooldown
- SP consumption
- Potion usage
- Loot filtering

Acceptance:

```text
Player can configure:

Bash when SP >= 20%
Potion when HP < 40%
Target nearest monster
```

and the simulation follows the rules.

---

# 48. Phase 3 — Server

Implement:

- Fastify
- HTTP health endpoint
- WebSocket server
- Game session
- Character state
- Combat session
- Event broadcasting

Acceptance:

```text
Browser connects to server.
Browser starts combat.
Server sends combat events.
```

---

# 49. Phase 4 — Frontend

Implement:

- Character panel
- Combat stage
- HP/SP
- Monster HP
- Damage numbers
- Combat log
- Configuration panel
- Inventory

Acceptance:

The player can visually watch a complete fight.

---

# 50. Phase 5 — Renderer Integration

Implement:

- Renderer service integration
- Player sprite
- Monster sprite
- Idle animation
- Attack animation
- Hit animation
- Death animation
- Asset caching

Acceptance:

The MVP combat uses actual game-style sprites rather than placeholders.

---

# 51. Phase 6 — Persistence

Implement PostgreSQL.

Persist:

- Character
- Stats
- Equipment
- Inventory
- Currency
- Combat configuration
- Last simulation timestamp

Acceptance:

Reloading the browser preserves character state.

---

# 52. Phase 7 — Offline Progression

Implement:

- `lastSimulationAt`
- Offline duration calculation
- Offline combat simulation
- Reward aggregation
- Result summary

Example:

```text
While you were away:

8h 14m

XP        +42,100
Zeny      +12,450
Jellopy   +38
Red Pot.  +4
Levels    +1
```

Acceptance:

The player can close the browser, wait, return, and receive deterministic progress.

---

# 53. Phase 8 — Authentication

Implement:

- Account creation
- Login
- Session management
- Logout
- Password reset or OAuth
- WebSocket authentication

Acceptance:

Each player can access only their own characters.

---

# 54. Phase 9 — Character Progression

Implement:

- Stat allocation
- Level-up UI
- Class progression
- Equipment slots
- Equipment comparison
- Item selling

---

# 55. Phase 10 — Content Expansion

Add:

- More maps
- More monsters
- More equipment
- More skills
- More classes
- Elements
- Races
- Cards
- Refines
- Rare drops

Content should be data-driven.

---

# 56. Phase 11 — Advanced Idle Systems

Potential features:

## Auto-sell

Automatically sell selected items.

## Auto-equip

Equip an item if it improves a configured score.

## Farming objectives

```text
Farm until:
- level >= 50
- 10,000 Zeny
- card obtained
- 100 monsters killed
```

## Multiple presets

Switch strategies automatically.

## Map progression

Unlock maps based on level or objectives.

---

# 57. Phase 12 — Social Features

Only after the single-player loop is proven.

Potential features:

- Leaderboards
- Guilds
- Parties
- Friends
- Chat
- Player profiles
- Achievements

---

# 58. Phase 13 — Multiplayer

If desired later:

```text
Party
  ↓
Shared map
  ↓
Multiple simulated characters
  ↓
Server-authoritative group combat
```

This should not require rewriting the combat engine.

The combat engine should be designed around generic actors:

```ts
interface CombatActor {
  id: string;
  team: 'player' | 'enemy';
  stats: Stats;
  abilities: Ability[];
}
```

---

# 59. Boss / MVP System

Future feature:

```text
Boss encounter
    ↓
Higher HP
Higher damage
Special mechanics
Rare loot
Card
Equipment
```

Possible idle design:

```text
Boss spawn
   ↓
Players farm it
   ↓
Server resolves attempts
   ↓
Leaderboard
```

Avoid implementing realtime MMO boss fights unless there is a strong product reason.

---

# 60. Economy

Currencies:

```text
Zeny
Premium currency (optional later)
```

MVP should only use Zeny.

Future sinks:

- Potion purchases
- Equipment
- Refine
- Teleport
- Repair
- NPC services
- Crafting

The economy must have meaningful sinks before introducing large amounts of currency generation.

---

# 61. Anti-Cheat

Because the server is authoritative, the attack surface is smaller.

Never accept:

```text
client says:
"I dealt 999999 damage"
```

Instead:

```text
client says:
"use Bash"

server:
validate
calculate
apply
reward
```

Never accept:

- Client-generated XP
- Client-generated items
- Client-generated Zeny
- Client-generated level
- Client-generated combat results

---

# 62. RNG

Use seeded or controlled RNG in the combat engine.

```ts
simulate({
  seed: 123456
});
```

Benefits:

- Reproducible tests
- Debugging
- Deterministic simulations
- Easier balancing

Production may use cryptographically secure server-side randomness where appropriate.

---

# 63. Performance

The server should avoid one permanent high-frequency loop per connected player.

Prefer:

```text
scheduled simulation
+
batched processing
+
event aggregation
```

For example, 10,000 idle characters should not mean 10,000 JavaScript loops executing every 50ms.

---

# 64. Scaling Strategy

Initial deployment:

```text
1 API/Game server
1 PostgreSQL
1 renderer
```

Later:

```text
Load Balancer
      │
 ┌────┼────┐
 ▼    ▼    ▼
Game Game Game
 │
 └──────┐
        ▼
      Redis
        │
        ▼
    PostgreSQL
```

The combat engine must remain stateless wherever possible.

---

# 65. Observability

Implement from early stages:

### Logs

- Authentication
- Combat errors
- Simulation errors
- Persistence errors
- WebSocket errors

### Metrics

- Active players
- Active combat sessions
- Simulations/sec
- Simulation duration
- Offline simulation duration
- WebSocket connections
- Error rate
- DB latency

### Product analytics

Track:

- First combat
- First level up
- First equipment drop
- First skill configuration
- First offline reward
- Map changes
- Session length
- Return rate

---

# 66. Error Handling

Game errors should not corrupt character state.

Use transactional persistence for:

```text
Level changes
Inventory changes
Currency changes
Equipment changes
```

If a simulation fails:

```text
Do not partially award rewards.
```

The server should either:

```text
commit complete result
```

or:

```text
commit no result
```

---

# 67. Save / Simulation Consistency

Important rule:

```text
lastSimulationAt
```

must be advanced atomically with the rewards generated from that simulation.

Otherwise:

```text
Player closes game
Simulation gives rewards
Save fails
Player reconnects
Simulation runs again
```

could duplicate rewards.

Correct transaction:

```text
BEGIN

simulate from lastSimulationAt
apply rewards
update character state
update lastSimulationAt

COMMIT
```

---

# 68. Idempotency

Important for reconnects and commands.

Commands should have IDs:

```json
{
  "commandId": "uuid",
  "type": "combat.config.update",
  "payload": {}
}
```

The server can ignore duplicated commands.

---

# 69. Testing Strategy

## Unit tests

Combat formulas.

```text
STR increases ATK
DEF reduces damage
Critical increases damage
Bash consumes SP
Potion activates below threshold
```

## Simulation tests

```text
Swordman kills Poring
Swordman dies to stronger monster
Bash improves time-to-kill
Potion prevents death
```

## Property tests

Potential later tests:

```text
damage >= 1
HP never exceeds maxHP
SP never exceeds maxSP
inventory quantity >= 0
XP never decreases
```

## Integration tests

- WebSocket authentication
- Combat start
- Configuration update
- Persistence
- Offline progression

## E2E

Use Playwright eventually.

---

# 70. Balance Tooling

Create a developer-only simulation command.

Example:

```bash
pnpm simulate \
  --character swordman \
  --map prontera_field \
  --duration 1h \
  --runs 10000
```

Output:

```text
Average:

XP/hour:       5,432
Zeny/hour:     1,243
Potion/hour:   4.2
Deaths/hour:   0.02
Kills/hour:    382
```

This will become extremely valuable for balancing.

---

# 71. Content Data Format

Prefer data-driven definitions.

Example:

```ts
export const poring: MonsterDefinition = {
  id: 'poring',
  name: 'Poring',
  level: 1,
  hp: 55,
  attack: 7,
  defense: 0,
  attackIntervalMs: 1800,
  experience: 10,
  zeny: {
    min: 1,
    max: 3,
  },
  drops: [
    {
      itemId: 'jellopy',
      chance: 0.7,
      minQuantity: 1,
      maxQuantity: 1,
    },
  ],
};
```

This makes adding content cheap.

---

# 72. Developer Tools

Create an internal debug panel with:

```text
Character
Map
Monster
Simulation speed
RNG seed
Current time
HP
SP
Cooldowns
Inventory
```

Buttons:

```text
[Spawn Monster]
[Kill Monster]
[Give XP]
[Give Item]
[Level Up]
[Simulate 1h]
[Simulate 24h]
[Reset Character]
```

This will drastically speed up development.

---

# 73. Security Model

Trust boundary:

```text
              UNTRUSTED
                  │
                  ▼
             Web Client
                  │
                  ▼
         Validation Boundary
                  │
                  ▼
          Authoritative Server
                  │
          ┌───────┴───────┐
          ▼               ▼
       Combat           Database
       Engine
```

The client is never authoritative.

---

# 74. Deployment

MVP can run with:

```text
Frontend:
Vercel / Cloudflare Pages / static hosting

Backend:
Fly.io / Railway / Render / AWS

Database:
Managed PostgreSQL

Renderer:
Containerized service
```

Production architecture can move to AWS or another cloud provider later.

---

# 75. CI/CD

Pipeline:

```text
Pull Request
    ↓
Install
    ↓
Lint
    ↓
Typecheck
    ↓
Unit tests
    ↓
Integration tests
    ↓
Build
    ↓
Deploy
```

---

# 76. Environment Variables

Example:

```text
DATABASE_URL=
SESSION_SECRET=
JWT_SECRET=
RENDERER_URL=
REDIS_URL=
SENTRY_DSN=
```

Never expose server secrets to the frontend.

---

# 77. MVP Acceptance Criteria

The MVP is complete when all of the following work:

### Character

- [ ] Swordman can be created
- [ ] Character has stats
- [ ] Character can level up
- [ ] Character has HP/SP
- [ ] Character has equipment

### Combat

- [ ] Player enters Prontera Field
- [ ] Monster is selected
- [ ] Auto attacks occur
- [ ] Damage is calculated server-side
- [ ] Critical hits occur
- [ ] Misses occur
- [ ] Monster dies
- [ ] Player can die
- [ ] Player can respawn

### Skills

- [ ] Bash works
- [ ] Bash consumes SP
- [ ] Bash respects cooldown
- [ ] Bash priority is configurable

### Potions

- [ ] HP threshold works
- [ ] SP threshold works
- [ ] Potions are consumed server-side

### Loot

- [ ] Monster drops items
- [ ] Inventory updates
- [ ] Loot filters work
- [ ] Zeny is awarded

### Presentation

- [ ] Player sprite renders
- [ ] Monster sprite renders
- [ ] Attack animation renders
- [ ] Hit animation renders
- [ ] Death animation renders
- [ ] Damage number appears
- [ ] Combat log updates

### Persistence

- [ ] Character survives browser refresh
- [ ] Inventory survives refresh
- [ ] Configuration survives refresh
- [ ] Last simulation time persists

### Offline

- [ ] Player can close browser
- [ ] Time passes
- [ ] Player returns
- [ ] Offline progress is calculated
- [ ] Rewards are displayed
- [ ] Progress cannot be duplicated

---

# 78. Suggested Implementation Order

The exact order should be:

```text
1. Repository
2. Shared types
3. Game data
4. Combat engine
5. Combat tests
6. WebSocket protocol
7. Server session
8. React shell
9. Combat UI
10. Renderer
11. PostgreSQL
12. Persistence
13. Offline simulation
14. Authentication
15. Equipment
16. More monsters
17. More maps
18. More skills
19. Economy
20. Advanced idle systems
```

Do not start with:

```text
Authentication
Accounts
Guilds
Social
Payments
Cloud infrastructure
```

before proving the combat loop.

---

# 79. Product Roadmap

## Milestone 0 — Combat Prototype

```text
Swordman
Poring
Fake sprites
Auto attack
Bash
```

Goal:

> Determine whether watching/configuring combat is fun.

---

## Milestone 1 — Playable MVP

```text
3 monsters
1 map
real renderer
inventory
equipment
drops
offline progression
```

Goal:

> A player can play for several days and meaningfully progress.

---

## Milestone 2 — Progression

```text
More equipment
More skills
More maps
More monsters
Stat allocation
Class progression
```

Goal:

> Build optimization becomes meaningful.

---

## Milestone 3 — Retention

```text
Daily objectives
Achievements
Presets
Map unlocks
Bosses
Rare drops
Cards
```

Goal:

> Give players reasons to return.

---

## Milestone 4 — Social

```text
Leaderboards
Guilds
Parties
Profiles
```

Goal:

> Add social competition after the solo game works.

---

## Milestone 5 — MMO-like Systems

Potentially:

```text
Market
Trading
Party combat
Guild content
PvP
World bosses
```

Goal:

> Only pursue if the game has demonstrated demand.

---

# 80. Important Architectural Decisions

## Decision 1

**React + Vite over Next.js for the initial game.**

Reason:

The game does not require SSR and benefits from a simple client application.

## Decision 2

**Server-authoritative combat.**

Reason:

Prevents cheating and simplifies consistency.

## Decision 3

**Discrete simulation instead of realtime physics.**

Reason:

Idle games do not require continuous world simulation.

## Decision 4

**Separate combat engine package.**

Reason:

Allows deterministic tests, offline simulation, balance tooling, and future server scaling.

## Decision 5

**Renderer separated from combat engine.**

Reason:

Visual assets should not influence authoritative gameplay.

## Decision 6

**Offline progression as a first-class system.**

Reason:

It is one of the defining mechanics of the product.

---

# 81. Future Architecture Evolution

Initial:

```text
Web
 ↓
Game Server
 ↓
PostgreSQL
```

Later:

```text
                 ┌──────────────┐
                 │   CDN        │
                 │ Game Assets  │
                 └──────┬───────┘
                        │
                        ▼
Web ───────► Load Balancer
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Game 1     Game 2    Game 3
              │         │         │
              └────┬────┴────┬────┘
                   ▼         ▼
                 Redis   PostgreSQL
                   │
                   ▼
             Background Jobs
                   │
                   ▼
             Analytics
```

The game should not adopt this complexity until scale requires it.

---

# 82. Definition of Done for New Features

A feature is considered complete only when:

- [ ] Product behavior is defined
- [ ] Game state is defined
- [ ] Server authority is defined
- [ ] Client presentation is defined
- [ ] Persistence requirements are defined
- [ ] Unit tests exist
- [ ] Integration tests exist where appropriate
- [ ] Error behavior is defined
- [ ] Analytics are defined if relevant
- [ ] Feature is documented

---

# 83. Core Principle for Future Development

Every new feature should answer three questions:

### 1. What does the server know?

Example:

```text
Skill cooldown
Inventory
Drop
XP
```

### 2. What does the client show?

Example:

```text
Skill animation
Damage number
Loot animation
```

### 3. What can the player configure?

Example:

```text
Skill priority
Target selection
Potion threshold
Loot filter
```

If these responsibilities remain separate, the project can grow considerably without turning into a traditional MMO architecture.

---

# 84. Final MVP Target

The first truly playable version should feel like:

```text
Login
  ↓
Create Swordman
  ↓
Enter Prontera Field
  ↓
Configure:
  - Attack
  - Bash
  - Potion
  - Loot
  ↓
Start farming
  ↓
Watch combat
  ↓
Get XP / Zeny / Loot
  ↓
Equip better weapon
  ↓
Change strategy
  ↓
Close browser
  ↓
Return later
  ↓
Receive offline rewards
  ↓
Become stronger
  ↓
Farm a harder map
```

That loop is the foundation of the entire game.

Everything else — authentication, more classes, more maps, guilds, market, PvP, rankings, bosses, social features — should be built around that loop rather than around a traditional MMORPG architecture.

---

# 85. Recommended First Sprint

The first sprint should intentionally be small.

### Sprint goal

> A Swordman can automatically kill Porings in a browser and receive XP and loot.

### Tasks

```text
[ ] Initialize monorepo
[ ] Create React/Vite app
[ ] Create Node/Fastify server
[ ] Create combat-engine package
[ ] Create shared protocol
[ ] Define Swordman
[ ] Define Poring
[ ] Implement basic attack
[ ] Implement damage
[ ] Implement attack interval
[ ] Implement death
[ ] Implement XP
[ ] Implement Zeny
[ ] Implement Jellopy drop
[ ] Implement WebSocket
[ ] Render player placeholder
[ ] Render Poring placeholder
[ ] Display HP
[ ] Display damage
[ ] Display combat log
```

### Sprint acceptance test

A developer can open the browser and observe:

```text
Swordman attacks Poring
        ↓
Damage appears
        ↓
Poring attacks Swordman
        ↓
Poring dies
        ↓
XP awarded
        ↓
Zeny awarded
        ↓
Jellopy awarded
        ↓
New Poring appears
        ↓
Combat continues automatically
```

Only after this works should the project move into renderer integration, persistence, authentication, and broader content.

---

# 86. Legal / Asset Consideration

The project is inspired by Ragnarok Online and may use tooling capable of rendering Ragnarok assets.

Before public distribution or monetization, verify:

- Rights to game assets
- Rights to extracted client resources
- Trademark usage
- Redistribution restrictions
- Commercial usage restrictions
- Hosting of generated sprites
- User-generated content implications

For an early private prototype, keep the asset pipeline isolated so assets can be replaced later if required.

---

# 87. Summary

The recommended architecture is:

```text
React + Vite
       │
       │ WebSocket
       ▼
Fastify Game Server
       │
       ▼
Pure Combat Engine
       │
       ├── Stats
       ├── Skills
       ├── AI
       ├── Damage
       ├── Drops
       ├── XP
       └── Offline Simulation
       │
       ├───────────────┐
       ▼               ▼
PostgreSQL       Asset Renderer
                      │
                 zrenderer /
                 ragassets
```

The most important implementation decisions are:

1. **Server-authoritative simulation**
2. **Discrete combat events**
3. **Separate simulation and presentation time**
4. **Pure deterministic combat engine**
5. **Offline progression**
6. **Data-driven game content**
7. **Renderer isolated from gameplay**
8. **WebSocket used for state/events, not frame synchronization**
9. **MVP focused on one complete gameplay loop**
10. **MMO/social features postponed until the idle loop is proven**

The project should first prove one thing:

> **Is configuring an RO-like character to farm automatically fun enough that the player wants to come back and optimize it?**

If the answer is yes, the architecture above gives enough room to grow from a tiny prototype into a significantly deeper idle RPG without requiring a rewrite into a traditional realtime MMO.
