import { Meter, type MeterKind } from '@ragidle/ui';

/**
 * Meter with the legacy `bar` class, so the combat stage nameplates can keep
 * shrinking it from styles.css. New code should use Meter from @ragidle/ui.
 */
export function Bar(props: { value: number; max: number; kind: MeterKind; label?: string }) {
  return <Meter {...props} className="bar" />;
}
