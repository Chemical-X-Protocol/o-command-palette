import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { CommandItem } from '../types';

export function useCommandSearch(sourceItems: MaybeRefOrGetter<CommandItem[]>) {
  // 1. Reactive Primitives
  const query = ref('');
  const selectedCategory = ref('all');

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
  const filteredItems = computed(() => {
    const items = toValue(sourceItems);
    return items.filter(isMatchingItem);
  });

  const hasResults = computed(() => filteredItems.value.length > 0);

  // 4. Helper Methods & Actions
  const clearSearch = () => {
    query.value = '';
    selectedCategory.value = 'all';
  };

  return {
    query,
    selectedCategory,
    filteredItems,
    hasResults,
    clearSearch
  };
}
