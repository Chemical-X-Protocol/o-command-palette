import { ref, computed, nextTick, type Ref } from 'vue';
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import type { useCommandSearch } from '../../composables/useCommandSearch';
import type { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';

/**
 * Palette Modal Domain Composable (3-5 property return limit)
 * Manages visibility, modal focus management, and dismissal lifecycle.
 */
export function usePaletteModal(
  props: CommandPaletteProps,
  emit: CommandPaletteEmits,
  search: ReturnType<typeof useCommandSearch>,
  keyboard: ReturnType<typeof useKeyboardNavigation>
) {
  const inputRef: Ref<HTMLInputElement | null> = ref(null);
  const dialogRef: Ref<HTMLElement | null> = ref(null);

  const isOpen = computed({
    get: () => props.modelValue ?? false,
    set: (val: boolean) => emit('update:modelValue', val)
  });

  const closePalette = (): void => {
    isOpen.value = false;
    if (props.query === undefined) {
      search.clearSearch();
    }
    keyboard.resetIndex();
    emit('close');
  };

  const openPalette = (): void => {
    isOpen.value = true;
    if (!props.hideHeader) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  };

  return {
    isOpen,
    inputRef,
    dialogRef,
    openPalette,
    closePalette
  };
}
