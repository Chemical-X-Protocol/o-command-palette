import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue';
import type { CommandItem, SearchProvider } from '../types';
import { useTimeoutFn } from './useTimeoutFn';

export function useCommandSearch(
  sourceItems: MaybeRefOrGetter<CommandItem[]>,
  providers?: MaybeRefOrGetter<SearchProvider[]>
) {
  // 1. Reactive Primitives
  const query = ref('');
  const selectedCategory = ref('all');
  const providerItems = ref<CommandItem[]>([]);
  const isSearching = ref(false);
  let activeSearchId = 0;

  // 2. Named Predicates & Filter Helpers
  const matchesCategory = (item: CommandItem, categoryId: string): boolean => {
    if (categoryId === 'all') return true;
    return item.category === categoryId;
  };

  const matchesKeywordToken = (token: string, searchHaystack: string): boolean => {
    return searchHaystack.includes(token);
  };

  const matchesSearchQuery = (item: CommandItem, rawQuery: string): boolean => {
    const trimmedQuery = rawQuery.trim().toLowerCase();
    if (!trimmedQuery) return true;

    const keywords = (item.keywords || []).join(' ').toLowerCase();
    const title = item.title.toLowerCase();
    const subtitle = (item.subtitle || '').toLowerCase();
    const category = item.category.toLowerCase();
    const haystack = `${title} ${subtitle} ${category} ${keywords}`;

    const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);
    return queryTokens.every((token) => matchesKeywordToken(token, haystack));
  };

  const isMatchingItem = (item: CommandItem): boolean => {
    const isCategoryMatched = matchesCategory(item, selectedCategory.value);
    const isQueryMatched = matchesSearchQuery(item, query.value);
    return isCategoryMatched && isQueryMatched;
  };

  // 3. Computed State & 2-Stage Atomic Booleans
  const staticFilteredItems = computed(() => {
    const items = toValue(sourceItems);
    return items.filter(isMatchingItem);
  });

  const filteredItems = computed(() => {
    const staticItems = staticFilteredItems.value;
    const dynamicItems = providerItems.value.filter((item) =>
      matchesCategory(item, selectedCategory.value)
    );

    if (dynamicItems.length === 0) {
      return staticItems;
    }

    const seenIds = new Set(staticItems.map((item) => item.id));
    const uniqueDynamic = dynamicItems.filter((item) => !seenIds.has(item.id));
    return [...staticItems, ...uniqueDynamic];
  });

  // 4. Self-Cleaning Timer & Actions
  const executeProviderSearch = async (searchTerm: string, searchId: number): Promise<void> => {
    const registeredProviders = toValue(providers) || [];
    const hasProviders = registeredProviders.length > 0;
    const isSufficientLength = searchTerm.trim().length >= 2;

    if (!hasProviders || !isSufficientLength) {
      providerItems.value = [];
      isSearching.value = false;
      return;
    }

    const activeCategory = selectedCategory.value;
    const targetProviders = registeredProviders.filter(
      (p) => activeCategory === 'all' || p.category === activeCategory
    );

    if (targetProviders.length === 0) {
      providerItems.value = [];
      isSearching.value = false;
      return;
    }

    isSearching.value = true;

    try {
      const resultsPromises = targetProviders.map(async (provider) => {
        try {
          return await provider.query(searchTerm);
        } catch (_error: unknown) {
          return [];
        }
      });

      const providerResults = await Promise.all(resultsPromises);

      if (searchId !== activeSearchId) return;

      providerItems.value = providerResults.flat();
    } finally {
      if (searchId === activeSearchId) {
        isSearching.value = false;
      }
    }
  };

  const { start: debounceSearch, stop: cancelDebounce } = useTimeoutFn(
    (trimmed: string, searchId: number) => {
      executeProviderSearch(trimmed, searchId);
    },
    180
  );

  const clearSearch = (): void => {
    query.value = '';
    selectedCategory.value = 'all';
    providerItems.value = [];
    isSearching.value = false;
    cancelDebounce();
  };

  // 5. Watchers
  watch([query, selectedCategory], ([newQuery]) => {
    cancelDebounce();

    const currentSearchId = ++activeSearchId;
    const trimmed = newQuery.trim();

    if (trimmed.length < 2) {
      providerItems.value = [];
      isSearching.value = false;
      return;
    }

    isSearching.value = true;
    debounceSearch(trimmed, currentSearchId);
  });

  return {
    query,
    selectedCategory,
    filteredItems,
    isSearching,
    clearSearch
  };
}
