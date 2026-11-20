import { ref, computed, watch, toValue, onScopeDispose, getCurrentScope, type MaybeRefOrGetter } from 'vue';
import type { CommandItem, SearchProvider } from '../types';

interface MatchScoreContext {
  readonly trimmedQuery: string;
  readonly queryTokens: readonly string[];
  readonly title: string;
  readonly categoryLabel: string;
  readonly route: string;
  readonly keywordsList: readonly string[];
  readonly keywordsText: string;
}

const SCORE_TIERS: ReadonlyArray<{
  readonly weight: number;
  readonly matches: (ctx: MatchScoreContext) => boolean;
}> = [
  { weight: 100, matches: (ctx) => ctx.title === ctx.trimmedQuery },
  { weight: 80, matches: (ctx) => ctx.title.startsWith(ctx.trimmedQuery) },
  { weight: 65, matches: (ctx) => ctx.queryTokens.every((t) => ctx.title.includes(t)) },
  { weight: 60, matches: (ctx) => ctx.keywordsList.some((kw) => kw === ctx.trimmedQuery) },
  {
    weight: 45,
    matches: (ctx) => {
      const scope = `${ctx.title} ${ctx.categoryLabel} ${ctx.keywordsText}`;
      return ctx.queryTokens.some((t) => ctx.title.includes(t)) && ctx.queryTokens.every((t) => scope.includes(t));
    }
  },
  {
    weight: 35,
    matches: (ctx) => {
      const scope = `${ctx.keywordsText} ${ctx.categoryLabel} ${ctx.route}`;
      return ctx.queryTokens.every((t) => scope.includes(t));
    }
  }
];

/**
 * Computes weighted relevance score for a command item against a user query.
 * Returns 0 when any query token is absent from the searchable fields.
 */
export function scoreCommandMatch(item: CommandItem, rawQuery: string): number {
  const trimmedQuery = rawQuery.trim().toLowerCase();
  if (!trimmedQuery) return 1;

  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle || '').toLowerCase();
  const category = item.category.toLowerCase();
  const categoryLabel = (item.categoryLabel || '').toLowerCase();
  const route = (item.route || '').toLowerCase();
  const keywordsList = (item.keywords || []).map((k) => k.toLowerCase());
  const keywordsText = keywordsList.join(' ');
  const haystack = `${title} ${subtitle} ${category} ${categoryLabel} ${route} ${keywordsText}`;

  const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);
  const allTokensMatch = queryTokens.every((token) => haystack.includes(token));
  if (!allTokensMatch) return 0;

  const ctx: MatchScoreContext = {
    trimmedQuery,
    queryTokens,
    title,
    categoryLabel,
    route,
    keywordsList,
    keywordsText
  };

  const matchedTier = SCORE_TIERS.find((tier) => tier.matches(ctx));
  return matchedTier ? matchedTier.weight : 20;
}

export function useCommandSearch(
  sourceItems: MaybeRefOrGetter<CommandItem[]>,
  providers?: MaybeRefOrGetter<SearchProvider[]>
) {
  // 1. Reactive Primitives
  const query = ref('');
  const selectedCategory = ref('all');
  const providerItems = ref<CommandItem[]>([]);
  const isSearching = ref(false);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let activeSearchId = 0;

  // 2. Named Predicates & Filter Helpers
  const matchesCategory = (item: CommandItem, categoryId: string): boolean => {
    if (categoryId === 'all') return true;
    return item.category === categoryId;
  };

  const isMatchingItem = (item: CommandItem): boolean => {
    const isCategoryMatched = matchesCategory(item, selectedCategory.value);
    if (!isCategoryMatched) return false;
    return scoreCommandMatch(item, query.value) > 0;
  };

  const sortByScore = (items: CommandItem[]): CommandItem[] => {
    const trimmed = query.value.trim();
    if (!trimmed) return items;

    return items
      .map((item, idx) => ({ item, idx, score: scoreCommandMatch(item, trimmed) }))
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))
      .map((entry) => entry.item);
  };

  // 3. Computed State & 2-Stage Atomic Booleans
  const staticFilteredItems = computed(() => {
    const items = toValue(sourceItems);
    return sortByScore(items.filter(isMatchingItem));
  });

  const filteredItems = computed(() => {
    const staticItems = staticFilteredItems.value;
    const dynamicItems = providerItems.value.filter((item) =>
      matchesCategory(item, selectedCategory.value)
    );

    if (dynamicItems.length === 0) {
      return staticItems;
    }

    // Merge and deduplicate by item id
    const seenIds = new Set(staticItems.map((item) => item.id));
    const uniqueDynamic = dynamicItems.filter((item) => !seenIds.has(item.id));
    return sortByScore([...staticItems, ...uniqueDynamic]);
  });

  const hasResults = computed(() => filteredItems.value.length > 0);

  // 4. Helper Methods & Actions
  const executeProviderSearch = async (searchTerm: string, searchId: number) => {
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
        } catch {
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

  const clearSearch = () => {
    query.value = '';
    selectedCategory.value = 'all';
    providerItems.value = [];
    isSearching.value = false;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  // 5. Watchers
  watch([query, selectedCategory], ([newQuery]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    const currentSearchId = ++activeSearchId;
    const trimmed = newQuery.trim();

    if (trimmed.length < 2) {
      providerItems.value = [];
      isSearching.value = false;
      return;
    }

    isSearching.value = true;
    debounceTimer = setTimeout(() => {
      executeProviderSearch(trimmed, currentSearchId);
    }, 180);
  });

  // 6. Autonomous Lifecycle Teardown
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    });
  }

  return {
    query,
    selectedCategory,
    filteredItems,
    isSearching,
    hasResults,
    clearSearch
  };
}
