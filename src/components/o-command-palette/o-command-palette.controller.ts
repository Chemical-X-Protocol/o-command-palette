import { watch } from 'vue';
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';
import { usePaletteSearch } from './usePaletteSearch';
import { usePaletteModal } from './usePaletteModal';
import { useCommandPresentation, isComponent } from './useCommandPresentation';
import { useCommandActions } from './useCommandActions';

export {
  usePaletteSearch,
  usePaletteModal,
  useCommandPresentation,
  useCommandActions,
  isComponent
};

/**
 * Coordinated Command Palette Controller
 * Coordinates 5 domain composables while adhering strictly to Chemical X standards.
 */
export function useCommandPaletteController(
  props: CommandPaletteProps,
  emit: CommandPaletteEmits
) {
  // 1. Coordinated Domain Composables (Exactly 5 Hook Invocations)
  const search = usePaletteSearch(props);
  const keyboard = useKeyboardNavigation();
  const modal = usePaletteModal(props, emit, search, keyboard);
  const presentation = useCommandPresentation(props);
  const actions = useCommandActions({
    props,
    emit,
    search,
    keyboard,
    closePalette: modal.closePalette
  });

  // 2. Query Sync Watchers
  watch(
    () => props.query,
    (newQuery) => {
      if (newQuery !== undefined && newQuery !== search.query.value) {
        search.query.value = newQuery;
      }
    },
    { immediate: true }
  );

  watch(search.query, (newQuery) => {
    keyboard.resetIndex();
    emit('update:query', newQuery);
  });

  // 3. Global Shortcut Trapping
  keyboard.setupGlobalShortcut(() => {
    if (modal.isOpen.value) {
      modal.closePalette();
    } else {
      modal.openPalette();
    }
  });

  return {
    modal,
    search,
    keyboard,
    presentation,
    actions
  };
}
