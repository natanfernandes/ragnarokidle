import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Global keyboard shortcuts, written like "Alt+E", "Space" or "Escape".
 * Letters match the physical key, so Alt shortcuts work on every layout.
 * Shortcuts without a modifier are ignored while a field, button or link has
 * focus, so typing and Space-to-click keep working.
 */
export function useHotkeys(bindings: Record<string, (event: KeyboardEvent) => void>) {
  const ref = useRef(bindings);
  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      for (const [combo, handler] of Object.entries(ref.current)) {
        if (!matches(combo, e)) continue;
        const hasModifier = e.altKey || e.ctrlKey || e.metaKey;
        if (!hasModifier && isInteractive(e.target)) return;
        e.preventDefault();
        handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function matches(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.split('+');
  const key = parts.pop() ?? '';
  const alt = parts.includes('Alt');
  const ctrl = parts.includes('Ctrl');
  const shift = parts.includes('Shift');
  if (e.altKey !== alt || e.ctrlKey !== ctrl || e.shiftKey !== shift || e.metaKey) return false;
  if (key.length === 1) return e.code === `Key${key.toUpperCase()}` || e.code === `Digit${key}`;
  return e.code === key || e.key === key;
}

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || INTERACTIVE_TAGS.has(target.tagName);
}

/** Tracks a CSS media query, e.g. useMediaQuery('(min-width: 64rem)'). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tailwind's `lg` breakpoint: the dock layout starts here. */
export const WIDE_SCREEN = '(min-width: 64rem)';
