import { Meter, type MeterKind } from '@ragidle/ui';

/** Thin HP bar for the combat stage nameplates. */
export function Bar(props: { value: number; max: number; kind: MeterKind; label?: string }) {
  return <Meter {...props} size="sm" className="bar" />;
}
