import type { CombatConfig, EquipmentSlot } from '@ragidle/shared';
import { GameClient } from './net/game-client';
import { PresentationScheduler } from './presentation/presentation-scheduler';
import { useGameStore } from './stores/game-store';

const scheduler = new PresentationScheduler((event, { animate }) =>
  useGameStore.getState().playEvent(event, animate),
);

const client = new GameClient({
  onStatus: (status) => {
    useGameStore.getState().setStatus(status);
    if (status !== 'connected' && status !== 'connecting') scheduler.reset();
  },
  onMessage: (message) => {
    const store = useGameStore.getState();
    if (message.type === 'combat.events') {
      scheduler.push(message.serverTime, message.events);
    } else if (message.type === 'state.snapshot') {
      store.applyServerMessage(message, scheduler.discardUntil(message.serverTime));
    } else {
      store.applyServerMessage(message);
    }
  },
});

export const game = {
  connect: () => client.connect(),
  disconnect: () => {
    client.close();
    scheduler.stop();
  },
  startCombat: (mapId: string) => client.send({ type: 'combat.start', mapId }),
  stopCombat: () => client.send({ type: 'combat.stop' }),
  updateConfig: (config: CombatConfig) => client.send({ type: 'combat.config.update', config }),
  equip: (itemId: string) => client.send({ type: 'item.equip', itemId }),
  unequip: (slot: EquipmentSlot) => client.send({ type: 'item.unequip', slot }),
};
