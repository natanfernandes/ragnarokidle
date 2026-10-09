import { gameData } from '@ragidle/game-data';
import { EQUIPMENT_SLOT_NAMES, EQUIPMENT_SLOTS, type EquipmentSlot } from '@ragidle/shared';
import { Button, cn, Panel } from '@ragidle/ui';
import { Shield } from 'lucide-react';
import { game } from '../game';
import { describeBonuses } from '../presentation/describe-item';
import { SLOT_ICON } from '../presentation/icons';
import { useGameStore } from '../stores/game-store';

/** Slots always listed, even when empty; the rest appear once something is worn. */
const MAIN_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'headTop'];

/** Worn items per slot, with their bonuses and a Remove button. */
export function EquipmentPanel(props: { className?: string }) {
  const equipment = useGameStore((s) => s.character?.equipment);
  if (!equipment) return null;
  const slots = EQUIPMENT_SLOTS.filter((slot) => MAIN_SLOTS.includes(slot) || equipment[slot]);

  return (
    <Panel title="Equipment" icon={<Shield className="size-4" />} className={props.className}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {slots.map((slot) => {
          const itemId = equipment[slot];
          const Icon = SLOT_ICON[slot];
          return (
            <li
              key={slot}
              className="flex items-center gap-3 rounded-control border border-line bg-surface-sunken p-2"
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-control border bg-surface-raised',
                  itemId
                    ? 'border-line-strong text-loot'
                    : 'border-dashed border-line text-text-faint',
                )}
              >
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs text-text-soft">{EQUIPMENT_SLOT_NAMES[slot]}</span>
                {itemId ? (
                  <span className="truncate font-medium">
                    {gameData.items[itemId]?.name ?? itemId}
                    <span className="ml-2 text-xs font-normal text-text-soft">
                      {describeBonuses(itemId)}
                    </span>
                  </span>
                ) : (
                  <span className="text-text-faint">Empty</span>
                )}
              </div>
              {itemId && (
                <Button size="sm" variant="ghost" onClick={() => game.unequip(slot)}>
                  Remove
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
