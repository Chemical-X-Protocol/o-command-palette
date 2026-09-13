<template>
  <div
    v-if="isOpen"
    class="o-command-palette-backdrop"
    @click="handleBackdropClick"
  >
    <div
      ref="dialogRef"
      class="o-command-palette"
      :style="{ '--palette-brand': brandColor }"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      @keydown="handleKeydown"
    >
      <!-- Header Slot / Input Bar -->
      <slot name="header" :query="search.query">
        <div class="o-command-palette__header">
          <svg
            class="o-command-palette__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref="inputRef"
            v-model="search.query.value"
            type="text"
            class="o-command-palette__input"
            :placeholder="placeholderText"
            autocomplete="off"
            spellcheck="false"
          />

          <button
            v-if="hasSearchQuery"
            type="button"
            class="o-command-palette__clear-btn"
            aria-label="Clear query"
            @click="search.query.value = ''"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <kbd class="o-command-palette__kbd">ESC</kbd>
        </div>
      </slot>

      <!-- Category Filter Ribbon -->
      <slot name="categories" :categories="availableCategories" :selected="search.selectedCategory.value">
        <div class="o-command-palette__categories">
          <button
            v-for="cat in availableCategories"
            :key="cat.id"
            type="button"
            class="o-command-palette__category-chip"
            :class="{ 'o-command-palette__category-chip--active': search.selectedCategory.value === cat.id }"
            @click="handleSelectCategory(cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>
      </slot>

      <!-- Results List -->
      <slot name="results" :items="search.filteredItems.value" :active-index="keyboard.activeIndex.value">
        <div class="o-command-palette__results">
          <div
            v-for="(item, index) in search.filteredItems.value"
            :key="item.id"
            class="o-command-palette__item"
            :class="{ 'o-command-palette__item--active': index === keyboard.activeIndex.value }"
            @mouseenter="handleItemHover(index)"
            @click="handleItemClick(item)"
          >
            <div
              class="o-command-palette__item-icon-box"
              :style="{ borderColor: item.iconColor || brandColor }"
            >
              <img
                v-if="item.logoUrl"
                :src="item.logoUrl"
                alt=""
                class="o-command-palette__item-logo"
              />
              <i
                v-else-if="item.icon"
                :class="item.icon"
                :style="{ color: item.iconColor || brandColor }"
              />
              <svg
                v-else
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                :style="{ color: item.iconColor || brandColor }"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <div class="o-command-palette__item-body">
              <div class="o-command-palette__item-title-row">
                <span class="o-command-palette__item-title">{{ item.title }}</span>
                <span v-if="item.categoryLabel" class="o-command-palette__item-badge">
                  {{ item.categoryLabel }}
                </span>
              </div>
              <span v-if="item.subtitle" class="o-command-palette__item-subtitle">
                {{ item.subtitle }}
              </span>
            </div>

            <div v-if="index === keyboard.activeIndex.value" class="o-command-palette__enter-indicator">
              <span>Go</span>
              <kbd class="o-command-palette__kbd">↵</kbd>
            </div>
          </div>

          <div v-if="!hasFilteredResults" class="o-command-palette__empty">
            No commands or results found for "{{ search.query.value }}"
          </div>
        </div>
      </slot>

      <!-- Footer Slot -->
      <slot name="footer">
        <div class="o-command-palette__footer">
          <div class="o-command-palette__shortcuts">
            <span class="o-command-palette__shortcut-item">
              <kbd class="o-command-palette__kbd">↑</kbd>
              <kbd class="o-command-palette__kbd">↓</kbd>
              <span>Navigate</span>
            </span>
            <span class="o-command-palette__shortcut-item">
              <kbd class="o-command-palette__kbd">↵</kbd>
              <span>Select</span>
            </span>
            <span class="o-command-palette__shortcut-item">
              <kbd class="o-command-palette__kbd">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
          <span>Chemical X</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommandPaletteProps, CommandPaletteEmits } from './types';
import { useCommandPaletteController } from './o-command-palette.controller';

const props = withDefaults(defineProps<CommandPaletteProps>(), {
  modelValue: false,
  items: undefined,
  categories: undefined,
  placeholder: '',
  brandColor: '#62c9ff',
  shortcutLabel: 'Cmd+K',
  navigate: undefined
});

const emit = defineEmits<CommandPaletteEmits>();

const {
  inputRef,
  dialogRef,
  isOpen,
  search,
  keyboard,
  availableCategories,
  brandColor,
  placeholderText,
  hasSearchQuery,
  hasFilteredResults,
  handleSelectCategory,
  handleItemHover,
  handleItemClick,
  handleKeydown,
  handleBackdropClick
} = useCommandPaletteController(props, emit);
</script>

<style scoped lang="scss">
@use './o-command-palette';
</style>
