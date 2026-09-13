import { ref, computed, getCurrentScope, onScopeDispose } from 'vue';
import type { CommandItem, SearchProvider } from '../types';

// Singleton registry stores
const globalCommands = ref<CommandItem[]>([]);
const dynamicProviders = ref<SearchProvider[]>([]);

export function useCommandRegistry() {
  // 1. Reactive Primitives & Computed
  const commands = computed(() => globalCommands.value);
  const providers = computed(() => dynamicProviders.value);

  // 2. Helper Methods & Actions
  const registerCommands = (items: CommandItem[]) => {
    const itemIds = new Set(items.map((item) => item.id));
    const retained = globalCommands.value.filter((existing) => !itemIds.has(existing.id));
    globalCommands.value = [...retained, ...items];

    // Autonomous Lifecycle Teardown if invoked within active Vue scope
    if (getCurrentScope()) {
      onScopeDispose(() => {
        globalCommands.value = globalCommands.value.filter((item) => !itemIds.has(item.id));
      });
    }
  };

  const registerSearchProvider = (provider: SearchProvider) => {
    dynamicProviders.value = [
      ...dynamicProviders.value.filter((p) => p.id !== provider.id),
      provider
    ];

    if (getCurrentScope()) {
      onScopeDispose(() => {
        dynamicProviders.value = dynamicProviders.value.filter((p) => p.id !== provider.id);
      });
    }
  };

  const executeCommand = async (
    item: CommandItem,
    routerNavigate?: (route: string) => void
  ): Promise<boolean> => {
    const hasAction = typeof item.action === 'function';
    const hasRoute = Boolean(item.route && routerNavigate);
    const hasHref = Boolean(item.href && typeof window !== 'undefined');

    if (hasAction) {
      await item.action!(item);
    } else if (hasRoute) {
      routerNavigate!(item.route!);
    } else if (hasHref) {
      window.open(item.href!, item.target || '_self');
    }

    const shouldClose = item.closeOnSelect !== false;
    return shouldClose;
  };

  return {
    commands,
    providers,
    registerCommands,
    registerSearchProvider,
    executeCommand
  };
}
