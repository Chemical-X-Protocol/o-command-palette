/**
 * Chemical X Protocol: Command Palette & Search Domain Types
 */

export interface CommandItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly icon?: string;
  readonly iconColor?: string;
  readonly logoUrl?: string;
  readonly badge?: string;
  readonly keywords?: string[];

  // Action / Navigation Targets
  readonly action?: (item: CommandItem) => void | Promise<void>;
  readonly route?: string;
  readonly href?: string;
  readonly target?: '_blank' | '_self';

  // Execution Behavior
  readonly closeOnSelect?: boolean;
}

export interface CommandCategory {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
}

export interface SearchProvider {
  readonly id: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly query: (term: string) => Promise<CommandItem[]> | CommandItem[];
}

export type PaletteState =
  | { readonly status: 'closed' }
  | { readonly status: 'open'; readonly activeIndex: number; readonly activeCategory: string };
