# @md-oss/design-system

...

## Adding components

To add `shadcn/ui` (base) component(s) to this package, run the following command:

```bash
pnpm add:components
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@md-oss/design-system/components/ui/button";
```

## Agent integration

Use the following commands to add relevant skills:

```bash
pnpm dlx skills add shadcn/ui
```
