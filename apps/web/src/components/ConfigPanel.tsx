import { gameData } from '@ragidle/game-data';
import type { CombatConfig, ItemCategory } from '@ragidle/shared';
import { game } from '../game';
import { useGameStore } from '../stores/game-store';

const LOOT_CATEGORIES: ItemCategory[] = ['consumable', 'material', 'equipment', 'card'];

export function ConfigPanel() {
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
    <section className="window">
      <h2>Farming</h2>
      <div className="row">
        {combat.active ? (
          <button onClick={game.stopCombat}>Stop</button>
        ) : (
          Object.values(gameData.maps).map((map) => (
            <button key={map.id} onClick={() => game.startCombat(map.id)}>
              Farm {map.name}
            </button>
          ))
        )}
      </div>

      <h3>Skills</h3>
      {bash && (
        <label className="row">
          <input
            type="checkbox"
            checked={bash.enabled}
            onChange={(e) =>
              update(
                (d) => (d.skills.find((s) => s.skillId === 'bash')!.enabled = e.target.checked),
              )
            }
          />
          Bash when SP ≥
          <PercentInput
            value={bash.conditions?.minSpPercent ?? 0}
            onChange={(v) =>
              update((d) => {
                const skill = d.skills.find((s) => s.skillId === 'bash')!;
                skill.conditions = { ...skill.conditions, minSpPercent: v };
              })
            }
          />
        </label>
      )}

      <h3>Potions</h3>
      {(['hp', 'sp'] as const).map((kind) => {
        const rule = config.potions[kind];
        return (
          <label key={kind} className="row">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => update((d) => (d.potions[kind].enabled = e.target.checked))}
            />
            {gameData.items[rule.itemId]?.name} when {kind.toUpperCase()} &lt;
            <PercentInput
              value={rule.belowPercent}
              onChange={(v) => update((d) => (d.potions[kind].belowPercent = v))}
            />
          </label>
        );
      })}

      <h3>Loot</h3>
      <div className="row wrap">
        {LOOT_CATEGORIES.map((category) => (
          <label key={category} className="chip">
            <input
              type="checkbox"
              checked={config.loot.pickupCategories.includes(category)}
              onChange={(e) =>
                update((d) => {
                  d.loot.pickupCategories = e.target.checked
                    ? [...d.loot.pickupCategories, category]
                    : d.loot.pickupCategories.filter((c) => c !== category);
                })
              }
            />
            {category}
          </label>
        ))}
      </div>
    </section>
  );
}

function PercentInput(props: { value: number; onChange: (value: number) => void }) {
  return (
    <span className="percent">
      <input
        type="number"
        min={0}
        max={100}
        step={5}
        value={props.value}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (Number.isFinite(value) && value >= 0 && value <= 100) props.onChange(value);
        }}
      />
      %
    </span>
  );
}
