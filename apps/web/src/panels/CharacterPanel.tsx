import { gameData } from '@ragidle/game-data';
import { SectionLabel, StatList } from '@ragidle/ui';
import { useGameStore } from '../stores/game-store';
import { rowClass } from './rows';

/** Status and equipment. HP, SP and XP live in the HUD bar. */
export function CharacterPanel() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  if (!character || !derived) return null;
  const equipped = Object.values(character.equipment).filter(Boolean) as string[];

  return (
    <>
      <SectionLabel className="mt-0">Status</SectionLabel>
      <StatList
        stats={[
          ['ATK', derived.atk],
          ['DEF', derived.def],
          ['HIT', derived.hit],
          ['FLEE', derived.flee],
          ['CRIT', derived.crit.toFixed(1)],
          ['Delay', `${derived.attackIntervalMs} ms`],
          ['Max HP', derived.maxHp],
          ['Max SP', derived.maxSp],
        ]}
      />
      <SectionLabel>Equipment</SectionLabel>
      <ul className="m-0 list-none p-0">
        {equipped.map((itemId) => (
          <li key={itemId} className={rowClass}>
            {gameData.items[itemId]?.name ?? itemId}
          </li>
        ))}
      </ul>
    </>
  );
}
