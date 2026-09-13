import { ref, onMounted, onScopeDispose } from 'vue';

export function useKeyboardNavigation() {
  // 1. Reactive Primitives
  const activeIndex = ref(0);

  // 2. Actions & Helpers
  const selectNext = (itemCount: number) => {
    const hasItems = itemCount > 0;
    if (!hasItems) return;
    activeIndex.value = (activeIndex.value + 1) % itemCount;
  };

  const selectPrevious = (itemCount: number) => {
    const hasItems = itemCount > 0;
    if (!hasItems) return;
    activeIndex.value = (activeIndex.value - 1 + itemCount) % itemCount;
  };

  const resetIndex = () => {
    activeIndex.value = 0;
  };

  const setupGlobalShortcut = (onTrigger: () => void) => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isMetaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/';
      const target = event.target as HTMLElement | null;
      const isEditable = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);

      const shouldTrigger = isMetaK || (isSlash && !isEditable);
      if (shouldTrigger) {
        event.preventDefault();
        onTrigger();
      }
    };

    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeydown);
      }
    });

    onScopeDispose(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown);
      }
    });
  };

  return {
    activeIndex,
    selectNext,
    selectPrevious,
    resetIndex,
    setupGlobalShortcut
  };
}
