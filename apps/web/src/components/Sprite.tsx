import type { SpriteDefinition } from '@ragidle/shared';

/** Placeholder sprites until the renderer service is integrated. */
export function Sprite({
  sprite,
  facing,
  armed = true,
}: {
  sprite: SpriteDefinition;
  facing: 'left' | 'right';
  armed?: boolean;
}) {
  const { shape, color } = sprite.placeholder;
  return (
    <svg
      viewBox="0 0 100 100"
      className="sprite-svg"
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      aria-hidden
    >
      <ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(0,0,0,0.25)" />
      {shape === 'blob' && (
        <g>
          <path
            d="M14 90 Q10 45 50 30 Q90 45 86 90 Z"
            fill={color}
            stroke="#c2185b"
            strokeWidth="2"
          />
          <ellipse cx="38" cy="50" rx="8" ry="5" fill="#fff" opacity="0.6" />
          <circle cx="62" cy="64" r="3.5" fill="#333" />
          <circle cx="78" cy="64" r="3.5" fill="#333" />
          <path d="M65 74 Q70 79 76 74" stroke="#333" strokeWidth="2" fill="none" />
        </g>
      )}
      {shape === 'bug' && (
        <g>
          <ellipse cx="34" cy="74" rx="16" ry="14" fill={color} stroke="#558b2f" strokeWidth="2" />
          <ellipse cx="56" cy="72" rx="16" ry="15" fill={color} stroke="#558b2f" strokeWidth="2" />
          <circle cx="76" cy="66" r="15" fill={color} stroke="#558b2f" strokeWidth="2" />
          <path d="M80 52 L86 36 M72 52 L70 36" stroke="#558b2f" strokeWidth="2" />
          <circle cx="82" cy="64" r="3" fill="#333" />
        </g>
      )}
      {shape === 'rabbit' && (
        <g>
          <ellipse cx="66" cy="22" rx="6" ry="20" fill={color} stroke="#bdbdbd" strokeWidth="2" />
          <ellipse cx="78" cy="24" rx="6" ry="18" fill={color} stroke="#bdbdbd" strokeWidth="2" />
          <ellipse cx="46" cy="72" rx="28" ry="20" fill={color} stroke="#bdbdbd" strokeWidth="2" />
          <circle cx="70" cy="52" r="15" fill={color} stroke="#bdbdbd" strokeWidth="2" />
          <circle cx="76" cy="50" r="3" fill="#d32f2f" />
        </g>
      )}
      {shape === 'humanoid' && (
        <g>
          {armed && (
            <rect
              x="70"
              y="22"
              width="5"
              height="48"
              rx="2"
              fill="#cfd8dc"
              stroke="#78909c"
              transform="rotate(25 72 60)"
            />
          )}
          <circle cx="50" cy="26" r="12" fill="#ffcc80" />
          <path d="M38 22 Q50 6 62 22 Z" fill="#6d4c41" />
          <rect x="36" y="38" width="28" height="30" rx="6" fill={color} />
          <rect x="38" y="66" width="10" height="24" rx="3" fill="#455a64" />
          <rect x="52" y="66" width="10" height="24" rx="3" fill="#455a64" />
          <rect x="26" y="40" width="10" height="22" rx="4" fill={color} />
          <rect x="64" y="40" width="10" height="22" rx="4" fill={color} />
        </g>
      )}
    </svg>
  );
}
