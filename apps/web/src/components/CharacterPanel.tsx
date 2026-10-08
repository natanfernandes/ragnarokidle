import { experienceToNextLevel, gameData } from '@ragidle/game-data';
import { Meter, StatList, Window } from '@ragidle/ui';
import { useGameStore } from '../stores/game-store';

export function CharacterPanel() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  if (!character || !derived) return null;

  const toNext = experienceToNextLevel(character.level);

  return (
    <Window
      title={character.name}
      subtitle={`${gameData.classes[character.classId]?.name} · Lv ${character.level}`}
    >
      <div className="flex flex-col gap-1">
        <Meter kind="hp" value={character.hp} max={derived.maxHp} />
        <Meter kind="sp" value={character.sp} max={derived.maxSp} />
        <Meter
          kind="xp"
          value={character.experience}
          max={toNext}
          label={`XP ${((character.experience / toNext) * 100).toFixed(1)}%`}
        />
      </div>
      <div className="font-mono font-semibold text-zeny tabular-nums">
        {character.zeny.toLocaleString('en-US')} Zeny
      </div>
      <StatList
        stats={[
          ['ATK', derived.atk],
          ['DEF', derived.def],
          ['HIT', derived.hit],
          ['FLEE', derived.flee],
          ['CRIT', derived.crit.toFixed(1)],
          ['Delay', `${derived.attackIntervalMs} ms`],
        ]}
      />
    </Window>
  );
}
