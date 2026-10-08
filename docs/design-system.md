# Design system (`packages/ui`)

`@ragidle/ui` is the single source of truth for how Ragnarok Idle looks. Every
screen is built from its tokens and components. The visual direction is called
**Prontera Window**: the classic Ragnarok Online windows (gradient title bar,
light body, dense numbers) on a night-sky ground, modernized only where an idle
game needs it.

Moodboard and references: https://claude.ai/artifact/F4bb43S1hdrXcfTZzsqW7V

## Rules

1. **Build UI from `@ragidle/ui`.** Panels are `Window`s, bars are `Meter`s,
   buttons are `Button`s. Do not hand-roll an equivalent in an app.
2. **Colors, fonts, radii and shadows come from tokens.** Use the Tailwind
   utilities generated from `packages/ui/src/theme.css` (`bg-window`,
   `text-hp`, `font-display`, `rounded-window`...). ESLint rejects hex colors
   in `className`.
3. **A new reusable pattern goes into `packages/ui` first**, with a token if it
   needs a new color, and is then used from the app. App folders only hold
   game-specific composition.
4. **App CSS is for things that are not reusable UI**, such as the combat stage
   animations in `apps/web/src/styles.css`. Panels use Tailwind utilities.
5. **Never encode meaning in color alone.** Meters show their value as text,
   rare items get weight or an icon, statuses have a label.
6. **Numbers are tabular.** Stats, logs and counters use `font-mono` and
   `tabular-nums`.
7. **Respect reduced motion.** The base layer shortens animations when the OS
   asks for it; do not override that.

## Tokens

Defined with Tailwind v4 `@theme` in `packages/ui/src/theme.css`. Each
`--color-*` token becomes `bg-*`, `text-*`, `border-*`, `from-*` and so on.

| Group    | Tokens                                                                                     | Use                                   |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| Surfaces | `ground`, `ground-raised`, `window`, `window-sunken`, `window-line`, `control*`, `title-*` | Page, windows, inputs, title bars     |
| Text     | `ink`, `ink-soft`, `ink-faint`, `on-ground`, `on-ground-soft`, `on-title`                  | Text on windows, on the page, on bars |
| Game     | `hp`, `sp`, `xp`, `zeny`, `loot`, `card`, `crit`, `miss`, `heal`, `danger`, `meter-track`  | RO conventions players already know   |
| Status   | `ok`, `warn`, `bad`                                                                        | Connection and system states          |
| Type     | `font-display` (Pixelify Sans), `font-sans` (Nunito), `font-mono` (IBM Plex Mono)          | Titles only / body / numbers and logs |
| Shape    | `rounded-window`, `rounded-control`, `shadow-window`                                       | Windows and controls                  |

Game colors follow Ragnarok Online: critical hits are yellow, misses blue,
card drops pink, damage taken red. Keep item rarity on a separate axis (border
or icon) so it never competes with HP/SP.

## Components

| Component                | What it is                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| `Window`, `SectionLabel` | RO window with title, optional subtitle and actions; group heading |
| `Meter`                  | HP / SP / XP / monster bar with an accessible text value           |
| `Button`                 | `default` and `primary` variants                                   |
| `CheckboxRow`            | Checkbox plus label and inline controls on one row                 |
| `ToggleChip`             | Toggleable pill for filters (loot categories)                      |
| `PercentField`           | 0-100 integer input with a `%` suffix                              |
| `StatList`               | Two-column label/value list, like the RO status window             |
| `StatusPill`             | Small status label with `ok`, `warn`, `bad`, `neutral` tones       |
| `Dialog`                 | Modal `Window`; closes on Escape or backdrop click                 |
| `cn`                     | Joins class names, skipping falsy values                           |

## Using it in an app

```ts
// main.tsx
import '@ragidle/ui/fonts';
import './styles.css';
```

```css
/* styles.css */
@import '@ragidle/ui/styles.css';
```

The app's Vite config needs `@tailwindcss/vite`. The package stylesheet loads
Tailwind, the theme and a `@source` for its own components, so classes used
inside `@ragidle/ui` are always generated.

## UX principles

These come from the moodboard and guide new screens:

- **State in two seconds.** Opening the tab answers where am I, what am I
  fighting, am I gaining or dying. Rates per hour sit at the top.
- **Offline return is an event.** Time away, totals, items grouped by rarity
  and the best thing that happened, highlighted.
- **Progressive disclosure.** Panels appear when they become relevant (loot
  filter after the first drop, skills after a job change).
- **Rare moments get ceremony, common ones stay quiet.** Level up and card
  drops are loud; a regular kill is not.
- **Explainable automation.** Every automatic action shows why it happened
  (which rule fired, which item was filtered).

## Roadmap

1. Combat log: group repeated lines (`×12`), filters by type, relative time,
   virtualization (TanStack Virtual), and an XP/h, Zeny/h, Kills/h strip.
2. Config panel as ordered "if condition then action" rules with a light on
   the last rule that fired.
3. Richer offline return dialog and toasts for level ups and rare drops.
4. Component catalog (Storybook) fed with fake protocol events.
5. Item tooltips in the RO style (icon, description, weight, slots).
