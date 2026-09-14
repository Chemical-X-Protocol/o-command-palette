import type { CommandItem } from '../../types';
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import type { useCommandSearch } from '../../composables/useCommandSearch';
import type { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';
import { useCommandRegistry } from '../../composables/useCommandRegistry';

export interface CommandActionsOptions {
  readonly props: CommandPaletteProps;
  readonly emit: CommandPaletteEmits;
  readonly search: ReturnType<typeof useCommandSearch>;
  readonly keyboard: ReturnType<typeof useKeyboardNavigation>;
  readonly closePalette: () => void;
}

/**
 * Command Actions Domain Composable (3-5 property return limit)
 * Manages click, hover, enter key execution, and backdrop dismissals.
 */
export function useCommandActions(options: CommandActionsOptions) {
  const { props, emit, search, keyboard, closePalette } = options;
  const registry = useCommandRegistry();

  const handleSelectCategory = (categoryId: string): void => {
    search.selectedCategory.value = categoryId;
    keyboard.resetIndex();
  };

  const handleItemHover = (index: number): void => {
    keyboard.activeIndex.value = index;
  };

  const handleExecuteActive = async (): Promise<void> => {
    const hasItems = search.filteredItems.value.length > 0;
    if (!hasItems) return;

    const currentItem = search.filteredItems.value[keyboard.activeIndex.value];
    if (!currentItem) return;

    emit('select', currentItem);
    emit('execute', currentItem);

    const shouldClose = await registry.executeCommand(currentItem, props.navigate);
    if (shouldClose) {
      closePalette();
    }
  };

  const handleItemClick = async (item: CommandItem): Promise<void> => {
    emit('select', item);
    emit('execute', item);

    const shouldClose = await registry.executeCommand(item, props.navigate);
    if (shouldClose) {
      closePalette();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    const totalCount = search.filteredItems.value.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      keyboard.selectNext(totalCount);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      keyboard.selectPrevious(totalCount);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleExecuteActive();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
      return;
    }
  };

  const handleBackdropClick = (event: MouseEvent): void => {
    const isTargetBackdrop = event.target === event.currentTarget;
    const isDropdown = props.variant === 'dropdown';
    const canClose = isTargetBackdrop || isDropdown;

    if (!canClose) return;
    closePalette();
  };

  return {
    handleSelectCategory,
    handleItemHover,
    handleItemClick,
    handleKeydown,
    handleBackdropClick
  };
}
