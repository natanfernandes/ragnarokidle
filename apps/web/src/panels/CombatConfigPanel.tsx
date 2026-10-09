import { gameData } from '@ragidle/game-data';
import type { CombatConfig, ItemCategory } from '@ragidle/shared';
import {
  Button,
  Field,
  Panel,
  PercentField,
  SectionLabel,
  Select,
  Tabs,
  ToggleRow,
} from '@ragidle/ui';
import { FlaskConical, Map, Play, Settings2, Square, Zap } from 'lucide-react';
import { game } from '../game';
import { CATEGORY_ICON } from '../presentation/icons';
import { useGameStore } from '../stores/game-store';
import { type ConfigTab, useUiStore } from '../stores/ui-store';
import { mapLevelRange } from './map-info';

const TABS: { id: ConfigTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'skills', label: 'Skills' },
  { id: 'potions', label: 'Potions' },
  { id: 'loot', label: 'Loot' },
];

const LOOT_CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'card', label: 'Cards' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'consumable', label: 'Consumables' },
  { id: 'material', label: 'Materials' },
];

type Update = (change: (draft: CombatConfig) => void) => void;

/** Everything the player configures about farming, grouped in tabs. */
export function CombatConfigPanel(props: { className?: string }) {
  const tab = useUiStore((s) => s.configTab);
  const setTab = useUiStore((s) => s.setConfigTab);
  const character = useGameStore((s) => s.character);
  const combat = useGameStore((s) => s.combat);
  if (!character || !combat) return null;

  const config = character.combatConfig;
  const update: Update = (change) => {
    const next = structuredClone(config);
    change(next);
    game.updateConfig(next);
  };

  return (
    <Panel
      title="Combat settings"
      icon={<Settings2 className="size-4" />}
      className={props.className}
      bodyClassName="gap-4"
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} aria-label="Combat settings" />
      {tab === 'general' && <GeneralTab />}
      {tab === 'skills' && <SkillsTab config={config} update={update} />}
      {tab === 'potions' && <PotionsTab config={config} update={update} />}
      {tab === 'loot' && <LootTab config={config} update={update} />}
    </Panel>
  );
}

function GeneralTab() {
  const character = useGameStore((s) => s.character);
  const combat = useGameStore((s) => s.combat);
  if (!character || !combat) return null;
  const mapId = combat.mapId ?? character.currentMapId;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Map" htmlFor="config-map">
        <Select
          id="config-map"
          icon={<Map className="size-4" />}
          value={mapId}
          onChange={(id) => game.startCombat(id)}
          options={Object.values(gameData.maps).map((m) => ({
            value: m.id,
            label: `${m.name} (Lv. ${mapLevelRange(m)})`,
          }))}
        />
      </Field>
      {combat.active ? (
        <Button onClick={game.stopCombat} title="Space">
          <Square className="size-4" /> Stop farming
        </Button>
      ) : (
        <Button variant="primary" onClick={() => game.startCombat(mapId)} title="Space">
          <Play className="size-4" /> Start farming
        </Button>
      )}
      <p className="m-0 text-xs text-text-faint">
        Picking another map starts farming there. Space starts or stops farming.
      </p>
    </div>
  );
}

function SkillsTab({ config, update }: { config: CombatConfig; update: Update }) {
  return (
    <div className="flex flex-col gap-3">
      {config.skills.map((rule) => {
        const name = gameData.skills[rule.skillId]?.name ?? rule.skillId;
        return (
          <ToggleRow
            key={rule.skillId}
            icon={<Zap className="size-4 text-primary" />}
            checked={rule.enabled}
            onChange={(checked) =>
              update((d) => (d.skills.find((s) => s.skillId === rule.skillId)!.enabled = checked))
            }
          >
            {name} when SP ≥
            <PercentField
              aria-label={`${name} minimum SP`}
              value={rule.conditions?.minSpPercent ?? 0}
              onChange={(v) =>
                update((d) => {
                  const s = d.skills.find((r) => r.skillId === rule.skillId)!;
                  s.conditions = { ...s.conditions, minSpPercent: v };
                })
              }
            />
          </ToggleRow>
        );
      })}
    </div>
  );
}

function PotionsTab({ config, update }: { config: CombatConfig; update: Update }) {
  return (
    <div className="flex flex-col gap-3">
      {(['hp', 'sp'] as const).map((kind) => {
        const rule = config.potions[kind];
        const name = gameData.items[rule.itemId]?.name ?? rule.itemId;
        return (
          <ToggleRow
            key={kind}
            icon={<FlaskConical className={kind === 'hp' ? 'size-4 text-hp' : 'size-4 text-sp'} />}
            checked={rule.enabled}
            onChange={(checked) => update((d) => (d.potions[kind].enabled = checked))}
          >
            {name} when {kind.toUpperCase()} &lt;
            <PercentField
              aria-label={`${name} threshold`}
              value={rule.belowPercent}
              onChange={(v) => update((d) => (d.potions[kind].belowPercent = v))}
            />
          </ToggleRow>
        );
      })}
    </div>
  );
}

function LootTab({ config, update }: { config: CombatConfig; update: Update }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Pick up</SectionLabel>
      {LOOT_CATEGORIES.map(({ id, label }) => {
        const Icon = CATEGORY_ICON[id];
        return (
          <ToggleRow
            key={id}
            icon={<Icon className="size-4" />}
            checked={config.loot.pickupCategories.includes(id)}
            onChange={(checked) =>
              update((d) => {
                d.loot.pickupCategories = checked
                  ? [...d.loot.pickupCategories, id]
                  : d.loot.pickupCategories.filter((c) => c !== id);
              })
            }
          >
            {label}
          </ToggleRow>
        );
      })}
    </div>
  );
}
