<script setup lang="ts" generic="T extends string | number">
// A dropdown select on KPopover, so it opens towards free space and scrolls like the other menus.
import { computed } from 'vue'
import KMenuItem from './KMenuItem.vue'
import KPopover from './KPopover.vue'
import type { Option } from './types'

const props = withDefaults(
  defineProps<{
    options: Option<T>[]
    placeholder?: string
    size?: 'md' | 'sm'
    /** The list's width; a percentage makes the select fill its container, and the list that share of it. */
    width?: string
    prefer?: 'up' | 'down'
    align?: 'left' | 'right'
    disabled?: boolean
    id?: string
  }>(),
  { placeholder: 'Choose…', size: 'md', width: '220px', prefer: 'down', align: 'left', disabled: false },
)
const model = defineModel<T>()
const current = computed(() => props.options.find((o) => o.value === model.value))
const fill = computed(() => props.width.endsWith('%'))
</script>

<template>
  <KPopover class="k-select-pop" :class="{ 'is-fill': fill }" :prefer="prefer" :align="align" :width="width" role="listbox">
    <template #trigger="{ toggle, open }">
      <button
        :id="id"
        type="button"
        class="k-btn k-select"
        :class="{ 'is-sm': size === 'sm', 'is-fill': fill }"
        :disabled="disabled"
        aria-haspopup="listbox"
        :aria-expanded="open"
        @click="toggle"
      >
        <span class="k-select-text" :class="{ 'k-muted': !current }">{{ current?.label ?? placeholder }}</span>
        <span class="k-caret" aria-hidden="true">▾</span>
      </button>
    </template>
    <template #default="{ close }">
      <KMenuItem
        v-for="o in options"
        :key="String(o.value)"
        role="option"
        :aria-selected="o.value === model"
        :current="o.value === model"
        :sub="o.sub"
        :disabled="o.disabled"
        :title="o.title"
        @click="model = o.value; close()"
      >{{ o.label }}</KMenuItem>
    </template>
  </KPopover>
</template>
