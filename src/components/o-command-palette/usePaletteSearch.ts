import { computed } from 'vue';
import type { CommandPaletteProps } from './types';
import { useCommandRegistry } from '../../composables/useCommandRegistry';
import { useCommandSearch } from '../../composables/useCommandSearch';

/**
 * Palette Search Domain Composable
 * Connects registry items and dynamic providers into reactive command search.
 */
export function usePaletteSearch(props: CommandPaletteProps) {
  const registry = useCommandRegistry();
  const allItems = computed(() => props.items ?? registry.commands.value);
  const allProviders = computed(() => [
    ...(props.providers ?? []),
    ...registry.providers.value
  ]);

  return useCommandSearch(allItems, allProviders);
}
