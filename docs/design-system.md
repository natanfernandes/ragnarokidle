# Design system (`packages/ui`)

`@ragidle/ui` is the single source of truth for how Ragnarok Idle looks. Every
screen is built from its tokens and components. The visual direction is
**Prontera Night**: dark navy surfaces, gold as the one accent color, Cinzel
for titles and Inter for everything else, with Ragnarok Online's game colors
(HP red, SP blue, card pink) carrying meaning.

The reference mockup the direction follows is
[design/ui-reference.jpg](design/ui-reference.jpg).

## Rules

1. **Build UI from `@ragidle/ui`.** Panels are `Panel`s, bars are `Meter`s,
   buttons are `Button`s, settings are `ToggleRow`s. Do not hand-roll an
   equivalent in an app.
2. **Colors, fonts, radii and shadows come from tokens.** Use the Tailwind
   utilities generated from `packages/ui/src/theme.css` (`bg-surface`,
   `text-primary`, `text-hp`, `font-display`, `rounded-panel`...). ESLint
   rejects hex colors in `className`.
3. **Gold is the only accent.** Use `primary` for the active navigation item,
   the main call to action and selected tabs. Everything else stays neutral or
   uses a game or feedback color.
4. **A new reusable pattern goes into `packages/ui` first**, with a token if it
   needs a new color, and is then used from the app. App folders only hold
   game-specific composition.
5. **App CSS is for things that are not reusable UI**, such as the combat stage
   in `apps/web/src/styles.css`. Panels use Tailwind utilities.
6. **Never encode meaning in color alone.** Meters show their value as text,
   rare items get a badge, statuses have a label.
7. **Numbers are tabular** (`tabular-nums`) wherever they update or line up.
8. **Show only what the game does.** Do not add controls for systems that do
   not exist yet; add them with the system.
9. **Respect reduced motion.** The base layer shortens animations when the OS
   asks for it; do not override that.

## Tokens

Defined with Tailwind v4 `@theme` in `packages/ui/src/theme.css`. Each
`--color-*` token becomes `bg-*`, `text-*`, `border-*`, `from-*` and so on.

| Group    | Tokens                                                                                | Use                                       |
| -------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| Surfaces | `bg-deep`, `bg`, `surface-sunken`, `surface`, `surface-raised`, `line`, `line-strong` | Sidebar and top bar, page, panels, inputs |
| Text     | `text`, `text-soft`, `text-faint`                                                     | Primary, secondary and hint text          |
| Brand    | `primary`, `primary-strong`, `primary-deep`, `on-primary`                             | Gold accent and text on gold              |
| Feedback | `success`, `warn`, `danger`, `info`                                                   | Toggles, results, errors, links           |
| Game     | `hp`, `sp`, `xp`, `zeny`, `loot`, `card`, `crit`, `miss`, `heal`, `meter-track`       | RO conventions players already know       |
| Type     | `font-display` (Cinzel), `font-sans` (Inter), `font-mono` (system)                    | Logo and place names / UI / shortcuts     |
| Shape    | `rounded-panel`, `rounded-control`, `shadow-panel`, `shadow-primary`                  | Panels, controls, gold elements           |

Cinzel is a capitals face: keep it for the logo, map names and other short
titles. Panel titles, character names and body text use Inter.

## Components

| Component                      | What it is                                                           |
| ------------------------------ | -------------------------------------------------------------------- |
| `Panel`, `SectionLabel`        | Dark surface with an optional icon, title and actions; group heading |
| `Tabs`                         | Tab list, `underline` (panel sections) or `pill` (filters)           |
| `Meter`                        | HP / SP / XP bar; `md` shows the value inside, `sm` is a thin line   |
| `Button`                       | `primary` (gold), `secondary` (outline), `ghost`; `sm`, `md`, `icon` |
| `Toggle`, `ToggleRow`          | Switch, and a setting row with icon, label, inline fields and switch |
| `Select`, `Field`              | Styled native select with an optional icon; label above a control    |
| `TextInput`                    | Single-line text input (email, password, names)                      |
| `PercentField`                 | 0-100 integer input with a `%` suffix                                |
| `StatList`                     | Label / value rows with optional icons, one or two columns           |
| `StatTile`                     | Headline number with its label (`stack`) or icon row (`row`)         |
| `Badge`                        | Small status label: `primary`, `success`, `warn`, `danger`, `info`   |
| `Alert`                        | Inline error message with `role="alert"`                             |
| `SideNav`                      | Vertical navigation; the active item is filled with gold             |
| `BottomNav`                    | Phone navigation fixed to the bottom, with icons and badges          |
| `Sheet`                        | Phone panel rising above `BottomNav`, capped at 60% of the screen    |
| `Dialog`                       | Modal `Panel`; closes on Escape or backdrop click                    |
| `useHotkeys`                   | Global shortcuts such as `Alt+E`; ignored while a control has focus  |
| `useMediaQuery`, `WIDE_SCREEN` | Tracks a media query; `WIDE_SCREEN` is Tailwind's `lg`               |
| `cn`                           | Joins class names, skipping falsy values                             |

Icons come from `lucide-react` in the app and are passed to components as
nodes. Item and stat icons are mapped in `apps/web/src/presentation/icons.tsx`
until the renderer serves real item icons.

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

## Screen layout

Wide screens (`lg` and up):

- **Side navigation** on the left: logo, one entry per screen (Hunt,
  Character, Bag, World), the shortcut list and the account card (email, VIP
  state, sign out).
- **Top bar** across the content: portrait, class and level with XP, HP and
  SP, Zeny, and the farming state with its timer. It stays visible on every
  screen.
- **Hunt** is the main screen. The combat stage is the largest element with
  combat settings beside it; the combat log, live results and character
  progress sit below.

Phones: the side navigation becomes a `BottomNav`, the top bar scrolls with
the page, panels stack in the same order and the account card closes the page.

Signed out, the sign-in screen shows the logo over a `Panel` with `Tabs`
(Sign in, Create account), `Field`s and a primary `Button`.

Rules:

- The stage is never hidden on the Hunt screen.
- A new screen is a new side navigation entry with a shortcut. A new group of
  settings is a new tab in the combat settings panel.
- Shortcuts follow the classic RO client where one exists:

  | Key              | Opens                    |
  | ---------------- | ------------------------ |
  | `Alt+H`          | Hunt                     |
  | `Alt+A`, `Alt+Q` | Character                |
  | `Alt+E`          | Bag                      |
  | `Alt+M`          | World                    |
  | `Space`          | Start or stop farming    |
  | `Esc`            | Closes the dialog on top |

- The current screen and the selected tabs are remembered in the browser.
- Live results are counted in the browser since the page loaded; they are a
  view of the events the server sent, not game state.

## UX principles

- **State in two seconds.** Opening the tab answers where am I, what am I
  fighting, am I gaining or dying.
- **Offline return is an event.** Time away, totals and the best thing that
  happened, highlighted.
- **Progressive disclosure.** Screens and tabs appear when the game has the
  system behind them.
- **Rare moments get ceremony, common ones stay quiet.** Level up and card
  drops are loud; a regular kill is not.
- **Explainable automation.** Every automatic action shows why it happened.

## Roadmap

1. Combat log: group repeated lines (`×12`), relative time, virtualization.
2. Combat settings as ordered "if condition then action" rules with a light on
   the last rule that fired.
3. Map overlay on the stage (minimap, coordinates) once maps have terrain.
4. Item icons and RO-style tooltips from the renderer.
5. Component catalog (Storybook) fed with fake protocol events.
