import { experienceToNextLevel, gameData } from '@ragidle/game-data';
import { useGameStore } from '../stores/game-store';
import { Bar } from './Bar';

export function CharacterPanel() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  if (!character || !derived) return null;

  const toNext = experienceToNextLevel(character.level);
  const rows: [string, string | number][] = [
    ['ATK', derived.atk],
    ['DEF', derived.def],
    ['HIT', derived.hit],
    ['FLEE', derived.flee],
    ['CRIT', derived.crit.toFixed(1)],
    ['Attack delay', `${derived.attackIntervalMs} ms`],
  ];

  return (
    <section className="window">
      <h2>
        {character.name}{' '}
        <small>
          {gameData.classes[character.classId]?.name} · Lv {character.level}
        </small>
      </h2>
      <Bar kind="hp" value={character.hp} max={derived.maxHp} />
      <Bar kind="sp" value={character.sp} max={derived.maxSp} />
      <Bar
        kind="xp"
        value={character.experience}
        max={toNext}
        label={`XP ${((character.experience / toNext) * 100).toFixed(1)}%`}
      />
      <div className="zeny">{character.zeny.toLocaleString('en-US')} Zeny</div>
      <dl className="stats">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
