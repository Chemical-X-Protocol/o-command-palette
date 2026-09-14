import { ref, computed, watch, nextTick, type Ref } from 'vue';
import type { CommandItem, CommandCategory } from '../../types';
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import { useCommandRegistry } from '../../composables/useCommandRegistry';
import { useCommandSearch } from '../../composables/useCommandSearch';
import { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';

export const isComponent = (val: unknown): boolean => {
  if (!val) return false;
  return typeof val === 'object' || typeof val === 'function';
};

/**
 * Palette Modal Domain Composable (3-5 property return limit)
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

/**
 * Command Presentation Domain Composable (3-5 property return limit)
 */
export function useCommandPresentation(props: CommandPaletteProps) {
  const brandColor = computed(() => props.brandColor || '#62c9ff');
  const shortcutLabel = computed(() => props.shortcutLabel || 'Cmd+K');
  const placeholderText = computed(
    () => props.placeholder || `Search commands and pages (${shortcutLabel.value})...`
  );

  const availableCategories = computed<CommandCategory[]>(() => {
    const hasCustomCategories = Boolean(props.categories && props.categories.length > 0);
    if (hasCustomCategories) {
      return props.categories!;
    }
    return [
      { id: 'all', label: 'All' },
      { id: 'pages', label: 'Pages' },
      { id: 'actions', label: 'Actions' }
    ];
  });

  const isCardItem = (item: CommandItem): boolean => {
    const isCardCategory = item.category === 'cards';
    const hasImage = Boolean(item.logoUrl);
    const hasCardLabel = item.categoryLabel?.toLowerCase().includes('card') ?? false;
    const isVisualCard = hasImage && hasCardLabel;
    return isCardCategory || isVisualCard;
  };

  const getItemCardStyle = (item: CommandItem): Record<string, string> => {
    if (!item.logoUrl) return {};
    return {
      '--card-bg-image': `url("${item.logoUrl}")`
    };
  };

  return {
    brandColor,
    placeholderText,
    availableCategories,
    isCardItem,
    getItemCardStyle
  };
}

export interface CommandActionsOptions {
  readonly props: CommandPaletteProps;
  readonly emit: CommandPaletteEmits;
  readonly search: ReturnType<typeof useCommandSearch>;
  readonly keyboard: ReturnType<typeof useKeyboardNavigation>;
  readonly registry: ReturnType<typeof useCommandRegistry>;
  readonly closePalette: () => void;
}

/**
 * Command Actions Domain Composable (3-5 property return limit)
 */
export function useCommandActions(options: CommandActionsOptions) {
  const { props, emit, search, keyboard, registry, closePalette } = options;

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

/**
 * Coordinated Command Palette Controller (3-5 property return limit)
 */
export function useCommandPaletteController(
  props: CommandPaletteProps,
  emit: CommandPaletteEmits
) {
  // 1. Composables & Stores
  const registry = useCommandRegistry();
  const allItems = computed(() => props.items ?? registry.commands.value);
  const allProviders = computed(() => [
    ...(props.providers ?? []),
    ...registry.providers.value
  ]);

  const search = useCommandSearch(allItems, allProviders);
  const keyboard = useKeyboardNavigation();
  const modal = usePaletteModal(props, emit, search, keyboard);
  const presentation = useCommandPresentation(props);
  const actions = useCommandActions({
    props,
    emit,
    search,
    keyboard,
    registry,
    closePalette: modal.closePalette
  });

  // 2. Watchers
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

  // 3. Global Shortcut Setup
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
