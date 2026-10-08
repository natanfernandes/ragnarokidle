import { gameData } from '@ragidle/game-data';
import { useGameStore } from '../stores/game-store';

export function InventoryPanel() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const entries = Object.entries(character.inventory).sort(([a], [b]) => a.localeCompare(b));
  const equipped = Object.values(character.equipment).filter(Boolean) as string[];

  return (
    <section className="window">
      <h2>Inventory</h2>
      {entries.length === 0 && <p className="muted">Empty</p>}
      <ul className="inventory">
        {entries.map(([itemId, qty]) => {
          const item = gameData.items[itemId];
          return (
            <li key={itemId} className={`item-${item?.category ?? 'unknown'}`}>
              <span>{item?.name ?? itemId}</span>
              <span>{qty}</span>
            </li>
          );
        })}
      </ul>
      <h3>Equipped</h3>
      <ul className="inventory">
        {equipped.map((itemId) => (
          <li key={itemId}>{gameData.items[itemId]?.name ?? itemId}</li>
        ))}
      </ul>
    </section>
  );
}
