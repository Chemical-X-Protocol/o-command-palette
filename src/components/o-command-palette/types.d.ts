import type { CommandCategory, CommandItem } from '../../types';

export interface CommandPaletteProps {
  readonly modelValue?: boolean;
  readonly items?: CommandItem[];
  readonly categories?: CommandCategory[];
  readonly placeholder?: string;
  readonly brandColor?: string;
  readonly shortcutLabel?: string;
  readonly navigate?: (route: string) => void;
}

export interface CommandPaletteEmits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', item: CommandItem): void;
  (e: 'execute', item: CommandItem): void;
  (e: 'close'): void;
}
