import { ref, computed, watch, nextTick, type Ref } from 'vue';
import type { CommandItem, CommandCategory } from '../../types';
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import { useCommandRegistry } from '../../composables/useCommandRegistry';
import { useCommandSearch } from '../../composables/useCommandSearch';
import { useKeyboardNavigation } from '../../composables/useKeyboardNavigation';

export function useCommandPaletteController(
  props: CommandPaletteProps,
  emit: CommandPaletteEmits
) {
  // 1. Composables & Stores
  const registry = useCommandRegistry();
  const allItems = computed(() => props.items ?? registry.commands.value);
  const search = useCommandSearch(allItems);
  const keyboard = useKeyboardNavigation();

  // 2. Reactive Primitives
  const inputRef: Ref<HTMLInputElement | null> = ref(null);
  const dialogRef: Ref<HTMLElement | null> = ref(null);

  // 3. Computed State & 2-Stage Atomic Booleans
  const isOpen = computed({
    get: () => props.modelValue ?? false,
    set: (val: boolean) => emit('update:modelValue', val)
  });

  const availableCategories = computed<CommandCategory[]>(() => {
    if (props.categories && props.categories.length > 0) {
      return props.categories;
    }
    return [
      { id: 'all', label: 'All' },
      { id: 'pages', label: 'Pages' },
      { id: 'actions', label: 'Actions' }
    ];
  });

  const brandColor = computed(() => props.brandColor || '#62c9ff');
  const shortcutLabel = computed(() => props.shortcutLabel || 'Cmd+K');
  const placeholderText = computed(
    () => props.placeholder || `Search commands and pages (${shortcutLabel.value})...`
  );

  const hasSearchQuery = computed(() => search.query.value.length > 0);
  const totalItemCount = computed(() => search.filteredItems.value.length);
  const hasFilteredResults = computed(() => totalItemCount.value > 0);

  // 4. Helper Methods & Actions
  const closePalette = () => {
    isOpen.value = false;
    emit('close');
  };

  const openPalette = () => {
    isOpen.value = true;
    nextTick(() => {
      inputRef.value?.focus();
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    search.selectedCategory.value = categoryId;
    keyboard.resetIndex();
  };

  const handleItemHover = (index: number) => {
    keyboard.activeIndex.value = index;
  };

  const handleExecuteActive = async () => {
    const hasItems = hasFilteredResults.value;
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

  const handleItemClick = async (item: CommandItem) => {
    emit('select', item);
    emit('execute', item);

    const shouldClose = await registry.executeCommand(item, props.navigate);
    if (shouldClose) {
      closePalette();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      keyboard.selectNext(totalItemCount.value);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      keyboard.selectPrevious(totalItemCount.value);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleExecuteActive();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
    }
  };

  const handleBackdropClick = (event: MouseEvent) => {
    const isTargetBackdrop = event.target === event.currentTarget;
    if (!isTargetBackdrop) return;
    closePalette();
  };

  // 5. Watchers
  watch(search.query, () => {
    keyboard.resetIndex();
  });

  watch(isOpen, (newVal) => {
    if (newVal) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    } else {
      search.clearSearch();
      keyboard.resetIndex();
    }
  });

  // 6. Global Shortcut Registration
  keyboard.setupGlobalShortcut(() => {
    if (isOpen.value) {
      closePalette();
    } else {
      openPalette();
    }
  });

  return {
    inputRef,
    dialogRef,
    isOpen,
    search,
    keyboard,
    availableCategories,
    brandColor,
    shortcutLabel,
    placeholderText,
    hasSearchQuery,
    hasFilteredResults,
    closePalette,
    openPalette,
    handleSelectCategory,
    handleItemHover,
    handleItemClick,
    handleKeydown,
    handleBackdropClick
  };
}
