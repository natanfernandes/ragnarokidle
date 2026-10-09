import { swordman } from '@ragidle/game-data';
import { cn } from '@ragidle/ui';
import { useMemo } from 'react';
import { playerSpriteUrl } from '../presentation/sprite-assets';
import { useGameStore } from '../stores/game-store';
import { ActorSprite } from './ActorSprite';

const IDLE = { kind: 'idle', key: 0 } as const;

/** The player's idle sprite in a framed box, for the top bar and character panels. */
export function Portrait(props: { size: 'sm' | 'lg'; className?: string }) {
  const assets = useGameStore((s) => s.assets);
  const appearance = assets?.rendererEnabled ? assets.playerAppearance : null;
  const spriteUrl = useMemo(() => (appearance ? playerSpriteUrl(appearance) : null), [appearance]);
  const armed = useGameStore((s) => !!s.character?.equipment.weapon);

  return (
    <div
      aria-hidden
      className={cn(
        'portrait relative shrink-0 overflow-hidden rounded-control border border-line bg-surface-sunken',
        props.size === 'sm' ? 'portrait-sm size-12' : 'portrait-lg h-28 w-24',
        props.className,
      )}
    >
      <div className="portrait-sprite">
        <ActorSprite
          animation={IDLE}
          spriteUrl={spriteUrl}
          direction={0}
          placeholder={swordman.sprite}
          facing="right"
          armed={armed}
        />
      </div>
    </div>
  );
}
