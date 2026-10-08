import { useEffect, useState } from 'react';
import type { SpriteDefinition } from '@ragidle/shared';
import { type RenderedAction, loadSprite } from '../presentation/sprite-assets';
import type { ActorAnimation, AnimationKind } from '../stores/game-store';
import { Sprite } from './Sprite';

/** How long one-shot actions are shown before returning to idle. */
const ONE_SHOT_MS: Partial<Record<RenderedAction, number>> = { attack: 600, hit: 400 };

const ACTION_FOR: Record<AnimationKind, RenderedAction> = {
  idle: 'idle',
  spawn: 'idle',
  attack: 'attack',
  skill: 'attack',
  hit: 'hit',
  dying: 'die',
  dead: 'die',
};

/**
 * Shows the rendered sprite for the current animation, or the placeholder
 * when rendered sprites are unavailable.
 */
export function ActorSprite(props: {
  animation: ActorAnimation;
  /** Builds the sprite URL for an action; null when no renderer is configured. */
  spriteUrl: ((action: RenderedAction) => string) | null;
  placeholder: SpriteDefinition;
  facing: 'left' | 'right';
}) {
  const { animation, spriteUrl } = props;
  // One-shot actions return to idle once they have played.
  const [finishedKey, setFinishedKey] = useState<number | null>(null);
  const requested = ACTION_FOR[animation.kind];
  const action: RenderedAction = finishedKey === animation.key ? 'idle' : requested;
  const [image, setImage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const duration = ONE_SHOT_MS[requested];
    if (!duration) return;
    const timer = setTimeout(() => setFinishedKey(animation.key), duration);
    return () => clearTimeout(timer);
  }, [requested, animation.key]);

  // A fresh object URL per play restarts the animated PNG from its first frame.
  useEffect(() => {
    if (!spriteUrl) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void loadSprite(spriteUrl(action)).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        if (action === 'idle') setUnavailable(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setImage(objectUrl);
      setUnavailable(false);
    });
    return () => {
      cancelled = true;
      // Keep the current frame on screen until the next image replaces it.
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000);
    };
  }, [spriteUrl, action, animation.key]);

  if (!spriteUrl || unavailable || !image) {
    return <Sprite sprite={props.placeholder} facing={props.facing} />;
  }
  return <img className="rendered-sprite" src={image} alt="" draggable={false} />;
}
