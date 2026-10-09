import { gameData } from '@ragidle/game-data';
import { EQUIPMENT_SLOTS, EQUIPMENT_SLOT_NAMES, type EquipmentSlot } from '@ragidle/shared';
import { game } from '../game';
import { describeBonuses } from '../presentation/describe-item';
import { useGameStore } from '../stores/game-store';

/** Slots always listed, even when empty; the rest appear once something is worn. */
const MAIN_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'headTop'];

export function EquipmentPanel() {
  const equipment = useGameStore((s) => s.character?.equipment);
  if (!equipment) return null;
  const slots = EQUIPMENT_SLOTS.filter((slot) => MAIN_SLOTS.includes(slot) || equipment[slot]);

  return (
    <section className="window">
      <h2>Equipment</h2>
      <ul className="inventory equipment">
        {slots.map((slot) => {
          const itemId = equipment[slot];
          return (
            <li key={slot}>
              <span className="slot-name">{EQUIPMENT_SLOT_NAMES[slot]}</span>
              {itemId ? (
                <>
                  <span className="item-name" title={describeBonuses(itemId)}>
                    {gameData.items[itemId]?.name ?? itemId}
                  </span>
                  <button className="small" onClick={() => game.unequip(slot)}>
                    Remove
                  </button>
                </>
              ) : (
                <span className="muted item-name">Empty</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
