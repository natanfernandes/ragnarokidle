import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { gameData, swordman } from '@ragidle/game-data';
import { type ActorAnimation, type FloatingText, useGameStore } from '../stores/game-store';
import { Bar } from './Bar';
import {
  RENDERED_ACTIONS,
  type RenderedAction,
  monsterSpriteUrl,
  playerSpriteUrl,
  preloadSprites,
} from '../presentation/sprite-assets';
import { ActorSprite } from './ActorSprite';

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

export function CombatStage() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  const monster = useGameStore((s) => s.monster);
  const combat = useGameStore((s) => s.combat);
  const playerAnimation = useGameStore((s) => s.playerAnimation);
  const monsterAnimation = useGameStore((s) => s.monsterAnimation);
  const playerDead = useGameStore((s) => s.playerDead);
  const assets = useGameStore((s) => s.assets);
  const rendered = assets?.rendererEnabled === true;
  const appearance = assets?.playerAppearance;
  const monsterId = monster?.monsterId;

  const playerUrl = useCallback(
    (action: RenderedAction) => playerSpriteUrl(appearance ?? '', action),
    [appearance],
  );
  const monsterUrl = useCallback(
    (action: RenderedAction) => monsterSpriteUrl(monsterId ?? '', action),
    [monsterId],
  );

  // Fetch every action up front so the first attack or hit does not stall.
  useEffect(() => {
    if (rendered && appearance) preloadSprites(RENDERED_ACTIONS.map(playerUrl));
  }, [rendered, appearance, playerUrl]);
  useEffect(() => {
    if (rendered && monsterId) preloadSprites(RENDERED_ACTIONS.map(monsterUrl));
  }, [rendered, monsterId, monsterUrl]);

  const monsterDef = monster ? gameData.monsters[monster.monsterId] : undefined;
  const mapName = combat?.mapId ? gameData.maps[combat.mapId]?.name : undefined;

  return (
    <section className="stage">
      <div className="stage-title">{mapName ?? 'Not farming'}</div>
      <div className="stage-ground">
        <div className="stage-slot">
          {character && derived && (
            <>
              <div className="nameplate">
                {character.name}
                <Bar kind="hp" value={character.hp} max={derived.maxHp} label="" />
              </div>
              <Actor
                side="player"
                animation={playerAnimation}
                dead={playerDead}
                rendered={rendered && !!appearance}
              >
                <ActorSprite
                  animation={playerAnimation}
                  spriteUrl={rendered && appearance ? playerUrl : null}
                  placeholder={swordman.sprite}
                  facing="right"
                />
              </Actor>
            </>
          )}
        </div>
        <div className="stage-slot">
          {monster && monsterDef && (
            <>
              <div className="nameplate">
                {monsterDef.name} <small>Lv {monsterDef.level}</small>
                <Bar kind="monster" value={monster.hp} max={monster.maxHp} label="" />
              </div>
              <Actor
                side="monster"
                animation={monsterAnimation}
                dead={monster.dying}
                rendered={rendered}
              >
                <ActorSprite
                  animation={monsterAnimation}
                  spriteUrl={rendered ? monsterUrl : null}
                  placeholder={monsterDef.sprite}
                  facing="left"
                />
              </Actor>
            </>
          )}
          {!monster && combat?.active && !playerDead && (
            <div className="stage-hint">Searching…</div>
          )}
        </div>
      </div>
      {playerDead && <div className="stage-banner">You died. Respawning…</div>}
    </section>
  );
}
