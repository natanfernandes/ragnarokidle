import { experienceToNextLevel, gameData } from '@ragidle/game-data';
import { EQUIPMENT_SLOTS, STAT_KEYS } from '@ragidle/shared';
import { cn, Meter, Panel, SectionLabel, StatList } from '@ragidle/ui';
import { Award } from 'lucide-react';
import { Portrait } from '../components/Portrait';
import { full } from '../presentation/format';
import { SLOT_ICON, SLOT_LABEL, STAT_ICON, STAT_LABEL } from '../presentation/icons';
import { useGameStore } from '../stores/game-store';

/** Class, level, base stats and equipped items at a glance. */
export function CharacterProgressPanel(props: { className?: string; showEmptySlots?: boolean }) {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const toNext = experienceToNextLevel(character.level);
  const pct = (character.experience / toNext) * 100;
  const slots = EQUIPMENT_SLOTS.filter((slot) => props.showEmptySlots || character.equipment[slot]);

  return (
    <Panel
      title="Character"
      icon={<Award className="size-4" />}
      className={props.className}
      bodyClassName="gap-4"
    >
      <div className="flex items-center gap-4">
        <Portrait size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-lg font-semibold">{character.name}</span>
          <span className="text-sm text-text-soft">
            {gameData.classes[character.classId]?.name} · Lv. {character.level}
          </span>
          <div className="flex items-center gap-2">
            <Meter
              kind="xp"
              size="sm"
              value={character.experience}
              max={toNext}
              className="flex-1"
            />
            <span className="text-xs tabular-nums">{pct.toFixed(1)}%</span>
          </div>
          <span className="text-xs text-text-soft tabular-nums">
            EXP {full(character.experience)} / {full(toNext)}
          </span>
        </div>
      </div>

      <StatList
        stats={STAT_KEYS.map((key) => {
          const Icon = STAT_ICON[key];
          return {
            label: STAT_LABEL[key],
            value: character.baseStats[key],
            icon: <Icon className="size-4" />,
          };
        })}
      />

      <div className="flex flex-col gap-2">
        <SectionLabel>Equipment</SectionLabel>
        <ul className="m-0 grid list-none grid-cols-5 gap-2 p-0">
          {slots.map((slot) => {
            const itemId = character.equipment[slot];
            const Icon = SLOT_ICON[slot];
            const name = itemId ? (gameData.items[itemId]?.name ?? itemId) : 'Empty';
            return (
              <li
                key={slot}
                title={`${SLOT_LABEL[slot]}: ${name}`}
                className={cn(
                  'grid aspect-square place-items-center rounded-control border bg-surface-sunken',
                  itemId
                    ? 'border-line-strong text-loot'
                    : 'border-dashed border-line text-text-faint',
                )}
              >
                <Icon aria-hidden className="size-5" />
                <span className="sr-only">
                  {SLOT_LABEL[slot]}: {name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
