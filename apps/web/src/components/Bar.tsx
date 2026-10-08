export function Bar(props: {
  value: number;
  max: number;
  kind: 'hp' | 'sp' | 'xp' | 'monster';
  label?: string;
}) {
  const pct = props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0;
  return (
    <div className={`bar bar-${props.kind}`} title={`${props.value} / ${props.max}`}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
      <span className="bar-label">{props.label ?? `${props.value} / ${props.max}`}</span>
    </div>
  );
}
