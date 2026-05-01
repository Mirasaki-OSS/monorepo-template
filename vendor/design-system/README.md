# @md-oss/design-system

Shared React component library, based on [`shadcn/ui`](https://ui.shadcn.com/docs/components) components.

This package includes:

- Core UI primitives (mostly shadcn/radix style building blocks)
- Higher-level product components (adaptive, sections, state)
- Theme providers and helpers
- Form utilities such as schema-driven object forms

## Quick usage

```tsx
import { Button } from '@md-oss/design-system/components/ui/button';
```

## Adding components

Add base shadcn/ui components:

```bash
pnpm add:components
```

Add shadcn registry components:

```bash
pnpm dlx shadcn@latest add @aceternity/code-block
```

## Component export catalog

The following list reflects the current component export entrypoints from this package.

### Adaptive components

- `./components/adaptive/dialog` - Responsive dialog shell that adapts to viewport (dialog/drawer patterns).
- `./components/adaptive/tabs` - Tabs that adapt interaction and layout across mobile/desktop contexts.
- `./components/adaptive/tooltip` - Tooltip behavior optimized for adaptive device interactions.

### Animated components

- `./components/animated/ambient-blob` - Animated decorative blob/background element.
- `./components/animated/content-marquee` - Horizontal marquee/scrolling content track.
- `./components/animated/staggered-list` - List wrapper with staggered entrance animations.

### Core utility components

- `./components/client-only` - Client-only render guard to prevent SSR-only execution.
- `./components/dev-utilities` - Development-only helpers and diagnostics UI.

### Form components

- `./components/forms/schema-object-form` - Recursive schema-driven object form renderer for Zod object schemas.

### Section/layout components

- `./components/sections/access-denied` - Access denied/permission error section with optional card mode.
- `./components/sections/page-container` - Consistent page width and spacing container.
- `./components/sections/particle-background` - Animated particle background section.

### State/feedback components

- `./components/state/confirmation-dialog` - Centralized confirmation dialog driven by store state.
- `./components/state/date-renderer` - Smart date display (relative/absolute) with timed refresh behavior.
- `./components/state/full-page-loader` - Full-screen loading overlay portal.
- `./components/state/http-error-alert` - HTTP error presentation component.
- `./components/state/loader` - Loading spinner/indicator component set.
- `./components/state/loading-overlay` - Overlay loading state and progress bar helpers.

### Theme components

- `./components/theme/client-only` - Theme-safe client-only wrapper.
- `./components/theme/provider` - Theme provider for app-level theming.
- `./components/theme/registry` - Theme registry wiring for SSR/client hydration.
- `./components/theme/switcher` - Theme switcher control component.
- `./components/theme/toggle` - Theme toggle control component.

### UI primitives

- `./components/ui/accordion` - Expand/collapse accordion.
- `./components/ui/aceternity/code-block` - Enhanced code block with syntax highlighting and UI controls.
- `./components/ui/alert` - Alert message primitive.
- `./components/ui/alert-dialog` - Modal alert/confirmation dialog primitive.
- `./components/ui/aspect-ratio` - Aspect ratio constrained container.
- `./components/ui/avatar` - Avatar/image/fallback primitive.
- `./components/ui/badge` - Status and label badge primitive.
- `./components/ui/breadcrumb` - Breadcrumb navigation.
- `./components/ui/button` - Button primitive with variants/sizes.
- `./components/ui/button-group` - Grouped button layout and behavior.
- `./components/ui/calendar` - Calendar/date picker surface.
- `./components/ui/card` - Card container primitives.
- `./components/ui/carousel` - Carousel/slider viewport components.
- `./components/ui/chart` - Chart scaffolding and style helpers.
- `./components/ui/checkbox` - Checkbox control.
- `./components/ui/collapsible` - Collapsible region primitive.
- `./components/ui/combobox` - Searchable combobox/select.
- `./components/ui/command` - Command palette primitives.
- `./components/ui/context-menu` - Context menu primitives.
- `./components/ui/dialog` - Dialog/modal primitives.
- `./components/ui/direction` - Directionality helpers (LTR/RTL support).
- `./components/ui/drawer` - Drawer/sheet-style side/bottom panel.
- `./components/ui/dropdown-menu` - Dropdown menu primitives.
- `./components/ui/empty` - Empty state UI primitive.
- `./components/ui/extended/callout` - Emphasized callout/information block.
- `./components/ui/extended/copy-button` - Copy-to-clipboard button helper.
- `./components/ui/extended/external-link` - External link primitive with safe defaults.
- `./components/ui/extended/inline-edit` - Inline editing suite (text, select, string list).
- `./components/ui/extended/spoiler` - Reveal/hide spoiler content component.
- `./components/ui/field` - Form field wrappers and helpers.
- `./components/ui/hover-card` - Hover card/popover card primitive.
- `./components/ui/input` - Text input primitive.
- `./components/ui/input-group` - Input with leading/trailing slot composition.
- `./components/ui/input-otp` - One-time-password segmented input.
- `./components/ui/item` - Generic item row primitive.
- `./components/ui/kbd` - Keyboard key hint display.
- `./components/ui/label` - Label primitive.
- `./components/ui/menubar` - Menubar primitives.
- `./components/ui/native-select` - Native select wrapper component.
- `./components/ui/navigation-menu` - Navigation menu primitives.
- `./components/ui/pagination` - Pagination controls.
- `./components/ui/popover` - Popover primitives.
- `./components/ui/progress` - Progress bar primitive.
- `./components/ui/radio-group` - Radio group controls.
- `./components/ui/resizable` - Resizable panel primitives.
- `./components/ui/scroll-area` - Styled scroll area primitive.
- `./components/ui/select` - Select primitives.
- `./components/ui/separator` - Separator/divider primitive.
- `./components/ui/sheet` - Sheet/dialog hybrid primitives.
- `./components/ui/sidebar` - Sidebar layout primitives.
- `./components/ui/skeleton` - Skeleton loading placeholder.
- `./components/ui/slider` - Slider/range control.
- `./components/ui/sonner` - Toast integration wrapper.
- `./components/ui/spinner` - Spinner loading indicator.
- `./components/ui/switch` - Toggle switch control.
- `./components/ui/table` - Table primitives.
- `./components/ui/tabs` - Tab primitives.
- `./components/ui/textarea` - Textarea input primitive.
- `./components/ui/toggle` - Toggle button primitive.
- `./components/ui/toggle-group` - Grouped toggle controls.
- `./components/ui/tooltip` - Tooltip primitives.

## Notes for consumers

- Import from package export entrypoints, not deep relative source paths.
- Prefer the closest semantic component first (for example, `state` or `sections`) before dropping to low-level `ui` primitives.
- Most components are designed to support class-based customization and slot-level prop overrides.
