# Conventions

- All code, comments, commits and docs are in English.
- UI is built only from the `@ragidle/ui` design system (`packages/ui`). Read
  [docs/design-system.md](docs/design-system.md) before changing any screen:
  use its components and token utilities, add new reusable patterns to the
  package first, and never use literal colors in apps.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` before
  pushing.
