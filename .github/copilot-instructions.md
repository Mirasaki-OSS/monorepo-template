# Project Instructions

This is a modern TypeScript pnpm turbo monorepo.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Key Commands

- `pnpm dev` - Run all development servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Test all packages

## Docker Commands

- `pnpm docker:build` - Build Docker images
- `pnpm docker:up` - Start services
- `pnpm docker:dev` - Development with hot reload
- `pnpm docker:down` - Stop services

See [README.md](../README.md) for full documentation.

---

## Design System Component Pattern

All components in `vendor/design-system` must follow the `classNames` + `slotProps` customization pattern. No legacy `props` nesting or manual destructuring is permitted.

### Canonical reference

`vendor/design-system/src/components/sections/access-denied.tsx`

### Rules

1. **`className`** — top-level string for the root element.
2. **`classNames`** — object of `slotName?: string` for per-slot class overrides.
3. **`slotProps`** — object of `slotName?: WithAsComponent<React.HTMLAttributes<El>>` for per-slot attribute overrides (including ARIA, event handlers, data attributes) and optional element/component override.
4. **Never** manually destructure `className` out of slot props. Always use `mergePropsWithClassName` from `@md-oss/design-system/lib/utils`.
5. **Always** pass defaults as the first argument, consumer slot props as the second, then extra class fragments as additional arguments.
6. **When a slot must support element swapping**, use `WithAsComponent<T>` and `resolveSlot(defaultEl, slotProps?.slot)`.
7. **No backwards compatibility** — when updating an existing component, remove the old prop shape entirely.

### `mergePropsWithClassName` signature

```ts
mergePropsWithClassName<T extends { className?: string }>(
  defaults: Omit<T, 'className'> & { className?: ClassValue },
  overrides?: T,
  ...classNames: ClassValue[]
): T
```

- `defaults` — base attributes and default classes (never reference `slotProps` here).
- `overrides` — the matching `slotProps.slotName` value.
- `...classNames` — additional class fragments, e.g. `className` or `classNames.title`.

### `WithAsComponent` and `resolveSlot`

```ts
type WithAsComponent<T> = T & { asComponent?: React.ElementType };

resolveSlot<T extends object>(
  defaultEl: React.ElementType,
  slotProps?: WithAsComponent<T>
): [React.ElementType, T | undefined]
```

- `WithAsComponent<T>` adds typed dynamic element override support to a slot.
- `resolveSlot` extracts `[Element, propsWithoutAsComponent]` so `mergePropsWithClassName` receives only valid element props.

### Type shape

```ts
type MyComponentProps = {
  className?: string;
  classNames?: {
    title?: string;
    description?: string;
  };
  slotProps?: {
    container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
    title?: WithAsComponent<React.HTMLAttributes<HTMLHeadingElement>>;
    description?: WithAsComponent<React.HTMLAttributes<HTMLParagraphElement>>;
  };
};
```

### Usage in JSX

```tsx
const [ContainerEl, containerSlotProps] = resolveSlot(
  'div',
  slotProps?.container
);
const [TitleEl, titleSlotProps] = resolveSlot('h1', slotProps?.title);
const [DescriptionEl, descriptionSlotProps] = resolveSlot('p', slotProps?.description);

const containerProps = mergePropsWithClassName<React.HTMLAttributes<HTMLDivElement>>(
  { role: 'region', className: 'flex flex-col gap-4' },
  containerSlotProps,
  className
);

const titleProps = mergePropsWithClassName<React.HTMLAttributes<HTMLHeadingElement>>(
  { className: 'text-2xl font-bold' },
  titleSlotProps,
  classNames?.title
);

const descriptionProps = mergePropsWithClassName<React.HTMLAttributes<HTMLParagraphElement>>(
  { className: 'text-muted-foreground' },
  descriptionSlotProps,
  classNames?.description
);

return (
  <ContainerEl {...containerProps}>
    <TitleEl {...titleProps}>{title}</TitleEl>
    <DescriptionEl {...descriptionProps}>{description}</DescriptionEl>
  </ContainerEl>
);
```

Consumers can then swap elements without losing any prop merging:

```tsx
<AccessDeniedPage
  slotProps={{ title: { asComponent: 'h2' } }}
  classNames={{ title: 'text-xl' }}
/>
<AccessDeniedPage
  slotProps={{ title: { asComponent: MyCustomHeading, 'aria-level': 2 } }}
/>
```

### Accessibility requirements

- Landmark regions (`role="region"`, `<section>`, etc.) must have an accessible name via `aria-labelledby` pointing to a heading with a stable `id` (use `React.useId()` as fallback).
- SVG icons must have `role="status"` or `role="img"`, `aria-labelledby` pointing to a `<title id={useId()}>` as the first child.
- Interactive controls must have `aria-label` or a visible `<label>` association.
- Disabled states must set both `disabled` and `aria-disabled`.

### Updating existing components (e.g. Callout)

When migrating a component to this pattern:

1. Replace any `titleProps?.className` manual spread with `mergePropsWithClassName`.
2. Replace standalone `cn()` wrappers on slot elements with a merged props object spread.
3. If a slot should support dynamic element replacement, change its slot type to `WithAsComponent<...>` and resolve it via `resolveSlot`.
4. Do not add container element override by default. Only support `slotProps.container.asComponent` for page-level or layout-level components where semantic integration is a real consumer need.
5. Replace any `className={cn(base, override)}` + `{...slotProps}` split with a single `{...mergePropsWithClassName(defaults, resolvedSlotProps, classNames?.slot)}`.
6. Remove all old prop shapes — no deprecation aliases.
7. Render the component on the test page, while trying to touch as many surface areas as possible (e.g. test the new `enabled` prop on `DevUtilities` by toggling it on and off and verifying the Tailwind indicator appears/disappears as expected): `apps/web/src/app/(home)/test/page.tsx`
8. Add a definition to the README.md if it's a new component, or update the existing README.md if it's a breaking change to an existing component.