import { Panel, StatList } from '@ragidle/ui';
import { Swords } from 'lucide-react';
import { CharacterProgressPanel } from '../panels/CharacterProgressPanel';
import { EquipmentPanel } from '../panels/EquipmentPanel';
import { useGameStore } from '../stores/game-store';

export function CharacterView() {
  const derived = useGameStore((s) => s.derived);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <CharacterProgressPanel showEquipment={false} />
      <div className="flex flex-col gap-4">
        <EquipmentPanel />
        {derived && (
          <Panel title="Combat stats" icon={<Swords className="size-4" />}>
            <StatList
              columns={2}
              stats={[
                { label: 'ATK', value: derived.atk },
                { label: 'MATK', value: derived.matk },
                { label: 'DEF', value: derived.def },
                { label: 'MDEF', value: derived.mdef },
                { label: 'HIT', value: derived.hit },
                { label: 'FLEE', value: derived.flee },
                { label: 'CRIT', value: `${derived.crit.toFixed(1)}%` },
                { label: 'Attack delay', value: `${derived.attackIntervalMs} ms` },
                { label: 'Max HP', value: derived.maxHp },
                { label: 'Max SP', value: derived.maxSp },
              ]}
            />
          </Panel>
        )}
      </div>
    </div>
  );
}
