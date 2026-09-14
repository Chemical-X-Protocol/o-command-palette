import { computed } from 'vue';
import type { CommandItem, CommandCategory } from '../../types';
import type { CommandPaletteProps } from './types';

export const isComponent = (val: unknown): boolean => {
  if (!val) return false;
  return typeof val === 'object' || typeof val === 'function';
};

/**
 * Command Presentation Domain Composable (3-5 property return limit)
 * Computes aesthetic tokens, category ribbons, and card presentation styles.
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
