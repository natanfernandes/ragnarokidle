import { CombatStage } from '../components/CombatStage';
import { CharacterProgressPanel } from '../panels/CharacterProgressPanel';
import { CombatConfigPanel } from '../panels/CombatConfigPanel';
import { CombatLogPanel } from '../panels/CombatLogPanel';
import { LiveResultsPanel } from '../panels/LiveResultsPanel';

/**
 * The main screen: the stage is always the largest element, combat settings
 * sit beside it, and the log, live results and character progress below.
 */
export function HuntView() {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
      <div className="min-w-0 lg:col-span-2">
        <CombatStage />
      </div>
      <CombatConfigPanel className="lg:col-span-2 xl:col-span-1" />
      <CombatLogPanel />
      <LiveResultsPanel />
      <CharacterProgressPanel className="lg:col-span-2 xl:col-span-1" />
    </div>
  );
}
