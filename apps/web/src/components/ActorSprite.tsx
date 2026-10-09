import { useEffect, useRef, useState } from 'react';
import type { SpriteDefinition } from '@ragidle/shared';
import {
  RENDERED_ACTIONS,
  type RenderedAction,
  type SpriteUrl,
  loadSprite,
  preloadSprites,
} from '../presentation/sprite-assets';
import type { ActorAnimation, AnimationKind } from '../stores/game-store';
import { Sprite } from './Sprite';

/** One-shot actions return to idle after their animation; used when its length is unknown. */
const ONE_SHOT_FALLBACK_MS: Partial<Record<RenderedAction, number>> = { attack: 600, hit: 400 };
/** Upper bound so a long sprite animation never hides the next action. */
const ONE_SHOT_MAX_MS = 1500;

const ACTION_FOR: Record<AnimationKind, RenderedAction> = {
  idle: 'idle',
  walk: 'walk',
  spawn: 'idle',
  attack: 'attack',
  skill: 'attack',
  hit: 'hit',
  dying: 'die',
  dead: 'die',
};

/** Resolves once the image is decoded, so swapping to it never shows a blank frame. */
function decoded(url: string): Promise<void> {
  const image = new Image();
  image.src = url;
  return image.decode().catch(() => undefined);
}

/** Placeholders only mirror horizontally: west-ish directions face left. */
function placeholderFacing(direction: number, fallback: 'left' | 'right'): 'left' | 'right' {
  if (direction >= 1 && direction <= 3) return 'left';
  if (direction >= 5) return 'right';
  return fallback;
}

/**
 * Shows the rendered sprite for the current animation and direction, or the
 * placeholder when rendered sprites are unavailable.
 */
export function ActorSprite(props: {
  animation: ActorAnimation;
  /** Builds the sprite URL for an action; null when no renderer is configured. */
  spriteUrl: SpriteUrl | null;
  /** Ragnarok Online direction (0 south ... 7 south-east). */
  direction: number;
  placeholder: SpriteDefinition;
  /** Draws a weapon on the humanoid placeholder. */
  armed?: boolean;
  /** Placeholder facing for straight north or south. */
  facing: 'left' | 'right';
}) {
  const { animation, spriteUrl, direction } = props;
  const [finishedKey, setFinishedKey] = useState<number | null>(null);
  const requested = ACTION_FOR[animation.kind];
  const action: RenderedAction = finishedKey === animation.key ? 'idle' : requested;
  const [image, setImage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const shown = useRef<string | null>(null);

  // Fetch every action for this direction up front so the next one does not stall.
  useEffect(() => {
    if (spriteUrl) preloadSprites(RENDERED_ACTIONS.map((a) => spriteUrl(a, direction)));
  }, [spriteUrl, direction]);

  // Walks last as long as the simulation says, whether or not a sprite loads.
  useEffect(() => {
    if (!animation.durationMs) return;
    const timer = setTimeout(() => setFinishedKey(animation.key), animation.durationMs);
    return () => clearTimeout(timer);
  }, [animation.key, animation.durationMs]);

  // A fresh object URL per play restarts the animated PNG from its first frame.
  // The previous frame stays on screen until the new one is decoded.
  useEffect(() => {
    if (!spriteUrl) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Walks end on their own timer (above); attacks and hits after one loop.
    const fallback = animation.durationMs ? undefined : ONE_SHOT_FALLBACK_MS[action];
    const finishAfter = (ms: number) => {
      timer = setTimeout(() => setFinishedKey(animation.key), Math.min(ms, ONE_SHOT_MAX_MS));
    };

    void loadSprite(spriteUrl(action, direction)).then(async (sprite) => {
      if (cancelled) return;
      if (!sprite) {
        if (action === 'idle') setUnavailable(true);
        else if (fallback) finishAfter(fallback);
        return;
      }
      const url = URL.createObjectURL(sprite.blob);
      await decoded(url);
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      const previous = shown.current;
      shown.current = url;
      setImage(url);
      setUnavailable(false);
      if (previous) setTimeout(() => URL.revokeObjectURL(previous), 1000);
      if (fallback) finishAfter(sprite.durationMs ?? fallback);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [spriteUrl, action, direction, animation.key, animation.durationMs]);

  useEffect(
    () => () => {
      if (shown.current) URL.revokeObjectURL(shown.current);
    },
    [],
  );

  if (!spriteUrl || unavailable || !image) {
    return (
      <Sprite
        sprite={props.placeholder}
        facing={placeholderFacing(direction, props.facing)}
        armed={props.armed}
      />
    );
  }
  return <img className="rendered-sprite" src={image} alt="" draggable={false} />;
}
