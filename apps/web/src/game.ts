import type { CombatConfig } from '@ragidle/shared';
import { GameClient } from './net/game-client';
import { PresentationScheduler } from './presentation/presentation-scheduler';
import { useGameStore } from './stores/game-store';
import { useSessionStats } from './stores/session-stats';

const DEV_NAME_KEY = 'ragidle.devName';

function devName(): string {
  try {
    const stored = localStorage.getItem(DEV_NAME_KEY);
    if (stored) return stored;
    const name = `hero${Math.floor(Math.random() * 10_000)}`;
    localStorage.setItem(DEV_NAME_KEY, name);
    return name;
  } catch {
    return 'hero';
  }
}

const scheduler = new PresentationScheduler((event, { animate }) => {
  useGameStore.getState().playEvent(event, animate);
  useSessionStats.getState().record(event);
});

const client = new GameClient(`dev:${devName()}`, {
  onStatus: (status) => {
    useGameStore.getState().setStatus(status);
    if (status === 'disconnected') scheduler.reset();
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
};
