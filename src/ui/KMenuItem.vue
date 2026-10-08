<script setup lang="ts">
// One row in a popover menu: the label, optional text on the right (`sub`), and lead / trail slots.
import { computed } from 'vue'
import KLink from './KLink.vue'

const props = withDefaults(
  defineProps<{ sub?: string; current?: boolean; danger?: boolean; disabled?: boolean; to?: string; href?: string; external?: boolean }>(),
  { current: false, danger: false, disabled: false, external: false },
)
defineEmits<{ click: [e: MouseEvent] }>()

const link = computed(() => !!(props.to || props.href) && !props.disabled)
const bind = computed(() =>
  link.value
    ? { to: props.to, href: props.href, external: props.external, 'aria-current': props.current ? 'page' : undefined }
    : { type: 'button', disabled: props.disabled, 'aria-current': props.current ? 'true' : undefined },
)
</script>

<template>
  <component
    :is="link ? KLink : 'button'"
    v-bind="bind"
    class="k-menu-item"
    :class="{ 'is-current': current, 'is-danger': danger }"
    role="menuitem"
    @click="$emit('click', $event)"
  >
    <slot name="lead"></slot>
    <span class="k-menu-main"><slot></slot></span>
    <span v-if="sub" class="k-menu-sub">{{ sub }}</span>
    <slot name="trail"></slot>
  </component>
</template>
