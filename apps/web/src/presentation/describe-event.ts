import { gameData } from '@ragidle/game-data';
import { type CombatEvent, PLAYER_ACTOR_ID } from '@ragidle/shared';

export type LogKind = 'combat' | 'reward' | 'loot' | 'system' | 'danger';

const monsterName = (instanceOrId: string) => {
  const id = instanceOrId.split('#')[0] ?? instanceOrId;
  return gameData.monsters[id]?.name ?? id;
};
const actorName = (id: string) => (id === PLAYER_ACTOR_ID ? 'You' : monsterName(id));
const itemName = (id: string) => gameData.items[id]?.name ?? id;
const skillName = (id: string) => gameData.skills[id]?.name ?? id;

/** Human-readable combat log line for an event, or null if it is not logged. */
export function describeEvent(event: CombatEvent): { text: string; kind: LogKind } | null {
  switch (event.type) {
    case 'monster_spawn':
      return { text: `A ${monsterName(event.monsterId)} appears.`, kind: 'system' };
    case 'attack':
    case 'move':
    case 'regen':
      return null;
    case 'skill_cast':
      return { text: `You cast ${skillName(event.skillId)}.`, kind: 'combat' };
    case 'damage': {
      const crit = event.critical ? ' Critical!' : '';
      const kind = event.targetId === PLAYER_ACTOR_ID ? 'danger' : 'combat';
      return {
        text: `${actorName(event.attackerId)} hit ${event.targetId === PLAYER_ACTOR_ID ? 'you' : monsterName(event.targetId)} for ${event.amount}.${crit}`,
        kind,
      };
    }
    case 'miss':
      return { text: `${actorName(event.attackerId)} missed.`, kind: 'combat' };
    case 'potion_used':
      return {
        text: `Used ${itemName(event.itemId)} (+${event.restoredHp || event.restoredSp} ${event.restoredHp ? 'HP' : 'SP'}). ${event.remaining} left.`,
        kind: 'system',
      };
    case 'monster_death':
      return { text: `${monsterName(event.monsterId)} was defeated.`, kind: 'reward' };
    case 'player_death':
      return { text: `You were killed by ${monsterName(event.killedBy)}.`, kind: 'danger' };
    case 'player_respawn':
      return { text: 'You respawn.', kind: 'system' };
    case 'loot':
      return event.pickedUp
        ? { text: `Looted ${event.quantity}x ${itemName(event.itemId)}.`, kind: 'loot' }
        : { text: `Ignored ${itemName(event.itemId)} (loot filter).`, kind: 'system' };
    case 'experience':
      return { text: `+${event.amount} XP`, kind: 'reward' };
    case 'zeny':
      return { text: `+${event.amount} Zeny`, kind: 'reward' };
    case 'level_up':
      return { text: `Level up! You are now level ${event.level}.`, kind: 'reward' };
  }
}
