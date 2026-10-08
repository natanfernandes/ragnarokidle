import { gameData } from '@ragidle/game-data';
import type { ItemCategory } from '@ragidle/shared';
import { cn, SectionLabel, Window } from '@ragidle/ui';
import { useGameStore } from '../stores/game-store';

const CATEGORY_TEXT: Partial<Record<ItemCategory, string>> = {
  card: 'font-semibold text-card',
  equipment: 'text-loot',
};

const rowClass = 'flex justify-between border-b border-dotted border-window-line py-0.5';

export function InventoryPanel() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const entries = Object.entries(character.inventory).sort(([a], [b]) => a.localeCompare(b));
  const equipped = Object.values(character.equipment).filter(Boolean) as string[];

  return (
    <Window title="Inventory">
      {entries.length === 0 && <p className="m-0 text-ink-soft">Empty</p>}
      <ul className="m-0 list-none p-0">
        {entries.map(([itemId, qty]) => {
          const item = gameData.items[itemId];
          return (
            <li key={itemId} className={cn(rowClass, item && CATEGORY_TEXT[item.category])}>
              <span>{item?.name ?? itemId}</span>
              <span className="font-mono tabular-nums">{qty}</span>
            </li>
          );
        })}
      </ul>
      <SectionLabel>Equipped</SectionLabel>
      <ul className="m-0 list-none p-0">
        {equipped.map((itemId) => (
          <li key={itemId} className={rowClass}>
            {gameData.items[itemId]?.name ?? itemId}
          </li>
        ))}
      </ul>
    </Window>
  );
}
