import { gameData } from '@ragidle/game-data';
import type { CombatConfig, ItemCategory } from '@ragidle/shared';
import { Button, CheckboxRow, PercentField, SectionLabel, ToggleChip } from '@ragidle/ui';
import { game } from '../game';
import { useGameStore } from '../stores/game-store';

const LOOT_CATEGORIES: ItemCategory[] = ['consumable', 'material', 'equipment', 'card'];

/** Farming controls, skill and potion rules, and the loot filter. */
export function AutomationPanel() {
  const character = useGameStore((s) => s.character);
  const combat = useGameStore((s) => s.combat);
  if (!character || !combat) return null;

  const config = character.combatConfig;
  const update = (change: (draft: CombatConfig) => void) => {
    const next = structuredClone(config);
    change(next);
    game.updateConfig(next);
  };
  const bash = config.skills.find((s) => s.skillId === 'bash');

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {combat.active ? (
          <Button onClick={game.stopCombat} title="Space">
            Stop
          </Button>
        ) : (
          Object.values(gameData.maps).map((map) => (
            <Button key={map.id} variant="primary" onClick={() => game.startCombat(map.id)}>
              Farm {map.name}
            </Button>
          ))
        )}
      </div>

      <SectionLabel>Skills</SectionLabel>
      {bash && (
        <CheckboxRow
          checked={bash.enabled}
          onChange={(checked) =>
            update((d) => (d.skills.find((s) => s.skillId === 'bash')!.enabled = checked))
          }
        >
          Bash when SP ≥
          <PercentField
            aria-label="Bash minimum SP"
            value={bash.conditions?.minSpPercent ?? 0}
            onChange={(v) =>
              update((d) => {
                const skill = d.skills.find((s) => s.skillId === 'bash')!;
                skill.conditions = { ...skill.conditions, minSpPercent: v };
              })
            }
          />
        </CheckboxRow>
      )}

      <SectionLabel>Potions</SectionLabel>
      {(['hp', 'sp'] as const).map((kind) => {
        const rule = config.potions[kind];
        const name = gameData.items[rule.itemId]?.name;
        return (
          <CheckboxRow
            key={kind}
            checked={rule.enabled}
            onChange={(checked) => update((d) => (d.potions[kind].enabled = checked))}
          >
            {name} when {kind.toUpperCase()} &lt;
            <PercentField
              aria-label={`${name} threshold`}
              value={rule.belowPercent}
              onChange={(v) => update((d) => (d.potions[kind].belowPercent = v))}
            />
          </CheckboxRow>
        );
      })}

      <SectionLabel>Loot</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {LOOT_CATEGORIES.map((category) => (
          <ToggleChip
            key={category}
            checked={config.loot.pickupCategories.includes(category)}
            onChange={(checked) =>
              update((d) => {
                d.loot.pickupCategories = checked
                  ? [...d.loot.pickupCategories, category]
                  : d.loot.pickupCategories.filter((c) => c !== category);
              })
            }
          >
            {category}
          </ToggleChip>
        ))}
      </div>
    </>
  );
}
