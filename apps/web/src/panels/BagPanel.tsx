import { gameData } from '@ragidle/game-data';
import type { ItemCategory } from '@ragidle/shared';
import { cn } from '@ragidle/ui';
import { useGameStore } from '../stores/game-store';
import { rowClass } from './rows';

const CATEGORY_TEXT: Partial<Record<ItemCategory, string>> = {
  card: 'font-semibold text-card',
  equipment: 'text-loot',
};

export function BagPanel() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const entries = Object.entries(character.inventory).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) return <p className="m-0 text-ink-soft">Your bag is empty.</p>;
  return (
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
  );
}
