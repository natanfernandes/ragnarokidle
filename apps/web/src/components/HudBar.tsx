import { experienceToNextLevel, gameData } from '@ragidle/game-data';
import { Meter } from '@ragidle/ui';
import { useGameStore } from '../stores/game-store';

/** Always-visible character summary above the stage. */
export function HudBar() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  const mapId = useGameStore((s) => s.combat?.mapId);
  if (!character || !derived) return null;

  const toNext = experienceToNextLevel(character.level);
  const mapName = mapId ? gameData.maps[mapId]?.name : undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-window border border-window-line bg-window px-3 py-2 text-ink shadow-window">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate font-display text-base">{character.name}</span>
        <span className="text-xs whitespace-nowrap text-ink-soft">
          {gameData.classes[character.classId]?.name} · Lv {character.level}
        </span>
      </div>
      <div className="order-last grid min-w-0 basis-full grid-cols-3 gap-2 md:order-none md:basis-0 md:flex-1">
        <Meter kind="hp" value={character.hp} max={derived.maxHp} />
        <Meter kind="sp" value={character.sp} max={derived.maxSp} />
        <Meter
          kind="xp"
          value={character.experience}
          max={toNext}
          label={`${((character.experience / toNext) * 100).toFixed(1)}%`}
        />
      </div>
      <div className="flex items-center gap-4 text-sm whitespace-nowrap">
        <span className="font-mono font-semibold text-zeny tabular-nums">
          {character.zeny.toLocaleString('en-US')} z
        </span>
        <span className="text-ink-soft">{mapName ?? 'Resting'}</span>
      </div>
    </div>
  );
}
