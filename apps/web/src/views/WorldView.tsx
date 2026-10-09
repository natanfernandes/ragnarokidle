import { gameData } from '@ragidle/game-data';
import { Badge, Button, Panel } from '@ragidle/ui';
import { Map as MapIcon, Play } from 'lucide-react';
import { game } from '../game';
import { mapLevelRange } from '../panels/map-info';
import { useGameStore } from '../stores/game-store';
import { useUiStore } from '../stores/ui-store';

/** Maps the player can farm, with the monsters that live there. */
export function WorldView() {
  const combat = useGameStore((s) => s.combat);
  const setView = useUiStore((s) => s.setView);

  return (
    <Panel title="World" icon={<MapIcon className="size-4" />}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {Object.values(gameData.maps).map((map) => {
          const farming = combat?.active && combat.mapId === map.id;
          const monsters = map.monsters
            .map((m) => gameData.monsters[m.monsterId]?.name ?? m.monsterId)
            .join(', ');
          return (
            <li
              key={map.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-line bg-surface-sunken p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-base font-semibold">{map.name}</span>
                <span className="text-xs text-text-soft">
                  Lv. {mapLevelRange(map)} · {monsters}
                </span>
              </div>
              {farming ? (
                <Badge tone="success">Farming</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    game.startCombat(map.id);
                    setView('hunt');
                  }}
                >
                  <Play className="size-3.5" /> Farm here
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
