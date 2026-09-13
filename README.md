# @chemx/o-command-palette

Universal command palette and site-indexing drop-in organism for the Chemical X ecosystem. Unifies the sovereign command execution patterns from MyCompass Admin and xophz.com into a crystalline, multi-framework component.

---

## Features

* **Universal Site & Command Indexing**: Search static routes, database items, dynamic APIs, and action callbacks through a single interface.
* **Autonomous Teardown**: Actions registered via `useCommandRegistry` cleanly unmount when page components tear down via `onScopeDispose`.
* **Global Shortcut Trapping**: Native `Cmd+K` / `Ctrl+K` and `/` quick-focus handlers with input avoidance.
* **Crystalline Organism Capsule**: Strictly decoupled layout, pure controller state, and glassmorphic styling.
* **Zero Inline Styles**: Designed with Starship glass styling tokens and Neon Cyan (`#62c9ff`) accents.

---

## Installation & Setup

```bash
pnpm add @chemx/o-command-palette
```

---

## Quickstart

### 1. Mount the Organism Component

Add the palette anywhere in your root application layout:

```vue
<template>
  <div id="app">
    <!-- Main content -->
    <router-view />

    <!-- Drop-in Command Palette -->
    <o-command-palette
      v-model="isPaletteOpen"
      :navigate="handleNavigate"
      brand-color="#62c9ff"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { OCommandPalette } from '@chemx/o-command-palette';

const router = useRouter();
const isPaletteOpen = ref(false);

const handleNavigate = (route: string) => {
  router.push(route);
};
</script>
```

---

### 2. Register Actions & Search Items from Any App / Page

Within any page, spark, or view component, call `useCommandRegistry`:

```vue
<script setup lang="ts">
import { useCommandRegistry } from '@chemx/o-command-palette';

const { registerCommands } = useCommandRegistry();

// Commands automatically deregister when this component unmounts
registerCommands([
  {
    id: 'action-export-csv',
    title: 'Export Active Records',
    subtitle: 'Download current filtered table as CSV',
    category: 'actions',
    categoryLabel: 'Action',
    icon: 'fad fa-file-csv',
    iconColor: '#10b981',
    keywords: ['export', 'csv', 'download', 'table'],
    action: async () => {
      await triggerCsvExport();
    }
  },
  {
    id: 'nav-settings',
    title: 'System Settings',
    subtitle: 'Manage theme and sovereign credentials',
    category: 'pages',
    categoryLabel: 'Page',
    icon: 'fad fa-cog',
    route: '/settings'
  }
]);
</script>
```

---

## CommandItem Specification

```typescript
export interface CommandItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly icon?: string;
  readonly iconColor?: string;
  readonly logoUrl?: string;
  readonly badge?: string;
  readonly keywords?: string[];

  // Action / Navigation Handlers
  readonly action?: (item: CommandItem) => void | Promise<void>;
  readonly route?: string;
  readonly href?: string;
  readonly target?: '_blank' | '_self';

  // Behavior
  readonly closeOnSelect?: boolean; // Defaults to true
}
```

---

## Directory Capsule Layout

```
o-command-palette/
├── o-command-palette.vue          # Declarative slot-based template (< 200 lines)
├── o-command-palette.controller.ts # Pure reactive state & 2-stage atomic booleans
├── _o-command-palette.scss        # Scoped glass styling
├── types.d.ts                     # Component Props & Emits declarations
└── index.ts                       # Entrypoint
```

---

## License

MIT - Chemical X Protocol
