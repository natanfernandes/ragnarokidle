import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { gameData, swordman } from '@ragidle/game-data';
import type { MapDefinition } from '@ragidle/shared';
import {
  type ActorAnimation,
  type FloatingText,
  PLAYER_DEFAULT_DIRECTION,
  type StagePlacement,
  useGameStore,
} from '../stores/game-store';
import { Bar } from './Bar';
import { monsterSpriteUrl, playerSpriteUrl } from '../presentation/sprite-assets';
import { ActorSprite } from './ActorSprite';
import { mapLevelRange } from '../panels/map-info';
import { MapPin } from 'lucide-react';

const FLOATING_TEXT_MS = 1000;

function Floating({ item }: { item: FloatingText }) {
  const remove = useGameStore((s) => s.removeFloating);
  useEffect(() => {
    const timer = setTimeout(() => remove(item.id), FLOATING_TEXT_MS);
    return () => clearTimeout(timer);
  }, [item.id, remove]);
  return <div className={`floating floating-${item.kind}`}>{item.text}</div>;
}

function Actor(props: {
  side: 'player' | 'monster';
  animation: ActorAnimation;
  dead?: boolean;
  rendered: boolean;
  children: React.ReactNode;
}) {
  const floating = useGameStore((s) => s.floating);
  const sprite = useRef<HTMLDivElement>(null);
  // Restart the CSS animation for every new action without remounting the
  // sprite, which would flash the placeholder over the rendered image.
  useLayoutEffect(() => {
    const element = sprite.current;
    if (!element) return;
    element.style.animation = 'none';
    void element.offsetWidth;
    element.style.animation = '';
  }, [props.animation.key]);
  return (
    <div className={`actor actor-${props.side} ${props.dead ? 'is-dead' : ''}`}>
      <div className="floating-layer">
        {floating
          .filter((f) => f.target === props.side)
          .map((f) => (
            <Floating key={f.id} item={f} />
          ))}
      </div>
      <div
        ref={sprite}
        className={`sprite anim-${props.animation.kind} ${props.rendered ? 'is-rendered' : ''}`}
      >
        {props.children}
      </div>
    </div>
  );
}

/** Vertical squash of the ground, for a Ragnarok-like three-quarter view. */
const GROUND_TILT = 0.55;

/**
 * Places an actor's feet on the field. Positions are percentages of the field,
 * so the stage scales with its container; x grows east and y grows north.
 */
function StageActor(props: {
  map: MapDefinition;
  placement: StagePlacement;
  children: React.ReactNode;
}) {
  const { map, placement } = props;
  const { x, y } = placement.position;
  const transition = placement.travelMs
    ? `left ${placement.travelMs}ms linear, top ${placement.travelMs}ms linear`
    : 'none';
  return (
    <div
      className="stage-actor"
      style={{
        left: `${((x + 0.5) / map.size.width) * 100}%`,
        top: `${((map.size.height - y - 0.5) / map.size.height) * 100}%`,
        // Actors further south are closer to the camera.
        zIndex: map.size.height - y,
        transition,
      }}
    >
      {props.children}
    </div>
  );
}

export function CombatStage() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  const monster = useGameStore((s) => s.monster);
  const combat = useGameStore((s) => s.combat);
  const playerPlacement = useGameStore((s) => s.playerPlacement);
  const playerAnimation = useGameStore((s) => s.playerAnimation);
  const monsterAnimation = useGameStore((s) => s.monsterAnimation);
  const playerDead = useGameStore((s) => s.playerDead);
  const assets = useGameStore((s) => s.assets);
  const rendered = assets?.rendererEnabled === true;
  const appearance = assets?.playerAppearance;
  const monsterId = monster?.monsterId;

  const playerUrl = useMemo(
    () => (rendered && appearance ? playerSpriteUrl(appearance) : null),
    [rendered, appearance],
  );
  const monsterUrl = useMemo(
    () => (rendered && monsterId ? monsterSpriteUrl(monsterId) : null),
    [rendered, monsterId],
  );

  const monsterDef = monster ? gameData.monsters[monster.monsterId] : undefined;
  const map = gameData.maps[combat?.mapId ?? character?.currentMapId ?? ''];
  const player: StagePlacement | null =
    playerPlacement ??
    (map ? { position: map.spawnPoint, travelMs: 0, direction: PLAYER_DEFAULT_DIRECTION } : null);

  return (
    <section className="stage">
      <div className="stage-title">
        <MapPin aria-hidden className="size-5 text-primary" />
        <div>
          <strong>{map?.name ?? 'Not farming'}</strong>
          {map && <small>{combat?.active ? `Lv. ${mapLevelRange(map)}` : 'Not farming'}</small>}
        </div>
      </div>
      {map && (
        <div
          className="field"
          style={{
            aspectRatio: `${map.size.width} / ${map.size.height * GROUND_TILT}`,
            backgroundSize: `${100 / map.size.width}% ${100 / map.size.height}%`,
          }}
        >
          {character && derived && player && (
            <StageActor map={map} placement={player}>
              <div className="nameplate">
                {character.name}
                <Bar kind="hp" value={character.hp} max={derived.maxHp} label="" />
              </div>
              <Actor
                side="player"
                animation={playerAnimation}
                dead={playerDead}
                rendered={!!playerUrl}
              >
                <ActorSprite
                  animation={playerAnimation}
                  spriteUrl={playerUrl}
                  direction={player.direction}
                  placeholder={swordman.sprite}
                  armed={!!character.equipment.weapon}
                  facing="right"
                />
              </Actor>
            </StageActor>
          )}
          {monster && monsterDef && (
            <StageActor map={map} placement={monster.placement}>
              <div className="nameplate">
                {monsterDef.name} <small>Lv {monsterDef.level}</small>
                <Bar kind="monster" value={monster.hp} max={monster.maxHp} label="" />
              </div>
              <Actor
                side="monster"
                animation={monsterAnimation}
                dead={monster.dying}
                rendered={!!monsterUrl}
              >
                <ActorSprite
                  animation={monsterAnimation}
                  spriteUrl={monsterUrl}
                  direction={monster.placement.direction}
                  placeholder={monsterDef.sprite}
                  facing="left"
                />
              </Actor>
            </StageActor>
          )}
        </div>
      )}
      {!monster && combat?.active && !playerDead && <div className="stage-hint">Searching…</div>}
      {playerDead && <div className="stage-banner">You died. Respawning…</div>}
    </section>
  );
}
