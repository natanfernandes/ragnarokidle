import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/game-store';

export function CombatLog() {
  const log = useGameStore((s) => s.log);
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <section className="window log-window">
      <h2>Combat log</h2>
      <ol className="log" ref={ref}>
        {log.map((entry) => (
          <li key={entry.id} className={`log-${entry.kind}`}>
            <time>{new Date(entry.timestamp).toLocaleTimeString()}</time> {entry.text}
          </li>
        ))}
      </ol>
    </section>
  );
}
