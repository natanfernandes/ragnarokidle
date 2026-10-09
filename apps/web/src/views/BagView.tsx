import { gameData } from '@ragidle/game-data';
import type { CharacterState, ItemCategory } from '@ragidle/shared';
import { Badge, Button, Panel, Tabs } from '@ragidle/ui';
import { Backpack } from 'lucide-react';
import { useState } from 'react';
import { ItemSlot } from '../components/ItemSlot';
import { game } from '../game';
import { previewEquip, signed } from '../presentation/describe-item';
import { useGameStore } from '../stores/game-store';

type Filter = 'all' | ItemCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumable', label: 'Consumables' },
  { id: 'card', label: 'Cards' },
  { id: 'material', label: 'Other' },
];

const matches = (filter: Filter, category: ItemCategory | undefined) =>
  filter === 'all' ||
  category === filter ||
  (filter === 'material' && !['equipment', 'consumable', 'card'].includes(category ?? ''));

export function BagView() {
  const character = useGameStore((s) => s.character);
  const [filter, setFilter] = useState<Filter>('all');
  if (!character) return null;

  const entries = Object.entries(character.inventory)
    .filter(([id]) => matches(filter, gameData.items[id]?.category))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <Panel title="Bag" icon={<Backpack className="size-4" />} bodyClassName="gap-4">
      <Tabs tabs={FILTERS} value={filter} onChange={setFilter} variant="pill" aria-label="Filter" />
      {entries.length === 0 ? (
        <p className="m-0 text-text-faint">Nothing here yet.</p>
      ) : (
        <ul className="m-0 grid list-none items-start gap-2 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(([itemId, quantity]) => {
            const item = gameData.items[itemId];
            return (
              <li
                key={itemId}
                className="flex flex-col gap-2 rounded-control border border-line bg-surface-sunken p-2"
              >
                <div className="flex items-center gap-3">
                  <ItemSlot itemId={itemId} className="size-11 bg-surface-raised" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item?.name ?? itemId}</span>
                    <span className="text-xs text-text-soft capitalize">{item?.category}</span>
                  </div>
                  {item?.category === 'card' && <Badge tone="primary">Rare</Badge>}
                  <span className="text-sm font-semibold tabular-nums">×{quantity}</span>
                </div>
                {item?.equipment && <EquipRow character={character} itemId={itemId} />}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** What wearing the item changes against the worn one, and the Equip button. */
function EquipRow({ character, itemId }: { character: CharacterState; itemId: string }) {
  const { changes, blockedBy } = previewEquip(character, itemId);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {changes.map(({ label, delta }) => (
        <Badge key={label} tone={delta > 0 ? 'success' : 'danger'}>
          {label} {signed(delta)}
        </Badge>
      ))}
      {blockedBy && <span className="text-xs text-text-faint">{blockedBy}</span>}
      <Button
        size="sm"
        className="ml-auto"
        disabled={blockedBy !== null}
        title={blockedBy ?? undefined}
        onClick={() => game.equip(itemId)}
      >
        Equip
      </Button>
    </div>
  );
}
