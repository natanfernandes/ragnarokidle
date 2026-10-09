import { gameData } from '@ragidle/game-data';
import type { CharacterState } from '@ragidle/shared';
import { game } from '../game';
import { previewEquip, signed } from '../presentation/describe-item';
import { useGameStore } from '../stores/game-store';

export function InventoryPanel() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const entries = Object.entries(character.inventory).sort(([a], [b]) => a.localeCompare(b));

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
              {item?.equipment && <EquipButton character={character} itemId={itemId} />}
              <span>{qty}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EquipButton({ character, itemId }: { character: CharacterState; itemId: string }) {
  const { changes, blockedBy } = previewEquip(character, itemId);
  return (
    <span className="equip-action">
      {changes.map(({ label, delta }) => (
        <span key={label} className={delta > 0 ? 'better' : 'worse'}>
          {label} {signed(delta)}
        </span>
      ))}
      <button
        className="small"
        disabled={blockedBy !== null}
        title={blockedBy ?? undefined}
        onClick={() => game.equip(itemId)}
      >
        Equip
      </button>
    </span>
  );
}
