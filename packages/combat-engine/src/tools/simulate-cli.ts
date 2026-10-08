/**
 * Developer balance tool.
 *
 *   pnpm simulate --map prontera_field --duration 1h --runs 100
 */
import { parseArgs } from 'node:util';
import { gameData } from '@ragidle/game-data';
import { createCharacter } from '../character';
import { simulateCombat } from '../simulate';

const { values } = parseArgs({
  options: {
    class: { type: 'string', default: 'swordman' },
    map: { type: 'string', default: 'prontera_field' },
    duration: { type: 'string', default: '1h' },
    runs: { type: 'string', default: '100' },
    seed: { type: 'string', default: '1' },
  },
});

function parseDuration(text: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/.exec(text);
  if (!match) throw new Error(`Invalid duration: ${text} (use e.g. 30s, 10m, 1h)`);
  const unit = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as 'ms' | 's' | 'm' | 'h'];
  return Number(match[1]) * unit;
}

const durationMs = parseDuration(values.duration);
const runs = Number(values.runs);
const baseSeed = Number(values.seed);
const hours = durationMs / 3_600_000;

const totals = { xp: 0, zeny: 0, kills: 0, deaths: 0, potions: 0, levels: 0 };
const items: Record<string, number> = {};
const started = performance.now();

for (let run = 0; run < runs; run++) {
  const character = createCharacter({ id: 'sim', name: 'Sim', classId: values.class, now: 0 });
  // Unlimited potions so supply does not skew the long-run averages.
  character.inventory.red_potion = 1_000_000;
  character.inventory.blue_potion = 1_000_000;
  const result = simulateCombat({
    character,
    mapId: values.map,
    durationMs,
    seed: baseSeed + run,
    recordEvents: false,
  });
  const s = result.statistics;
  totals.xp += s.experienceGained;
  totals.zeny += s.zenyGained;
  totals.kills += s.kills;
  totals.deaths += s.deaths;
  totals.levels += s.levelsGained;
  totals.potions += Object.values(s.potionsUsed).reduce((a, b) => a + b, 0);
  for (const [id, qty] of Object.entries(s.itemsLooted)) items[id] = (items[id] ?? 0) + qty;
}

const perHour = (value: number) =>
  (value / runs / hours).toLocaleString('en-US', { maximumFractionDigits: 2 });
console.log(`Class ${values.class}, map ${values.map}, ${values.duration} x ${runs} runs`);
console.log(`(${(performance.now() - started).toFixed(0)} ms)\n`);
console.log('Average per hour:');
console.log(`  XP:       ${perHour(totals.xp)}`);
console.log(`  Zeny:     ${perHour(totals.zeny)}`);
console.log(`  Kills:    ${perHour(totals.kills)}`);
console.log(`  Deaths:   ${perHour(totals.deaths)}`);
console.log(`  Potions:  ${perHour(totals.potions)}`);
console.log(`  Levels:   ${perHour(totals.levels)}`);
console.log('  Items:');
for (const [id, qty] of Object.entries(items).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${(gameData.items[id]?.name ?? id).padEnd(14)} ${perHour(qty)}`);
}
