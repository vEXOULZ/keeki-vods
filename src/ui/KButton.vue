<script setup lang="ts">
// Every button and button-styled link. `primary` is the filled accent one (Watch); `marquee` the big outlined
// uppercase one (`accent` colours it); `filter` the uppercase toggle at the start of a filter row.
import KLink from './KLink.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'marquee' | 'filter' | 'ghost' | 'danger' | 'danger-solid'
    accent?: boolean
    size?: 'md' | 'sm'
    icon?: boolean
    /** Accessible name (and tooltip), for icon buttons. */
    label?: string
    loading?: boolean
    block?: boolean
    pressed?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    to?: string
    href?: string
    external?: boolean
  }>(),
  { variant: 'default', accent: false, size: 'md', icon: false, block: false, loading: false, pressed: undefined, disabled: false, type: 'button' },
)
defineEmits<{ click: [e: MouseEvent] }>()

const classes = () => [
  'k-btn',
  props.variant !== 'default' && `is-${props.variant}`,
  props.accent && 'is-accent',
  props.size === 'sm' && 'is-sm',
  props.icon && 'is-icon',
  props.block && 'is-block',
  props.pressed && 'is-pressed',
]
</script>

<template>
  <KLink
    v-if="(to || href) && !disabled"
    :class="classes()"
    :to="to"
    :href="href"
    :external="external"
    :title="label"
    :aria-label="icon ? label : undefined"
  ><slot></slot></KLink>
  <button
    v-else
    :type="type"
    :class="classes()"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-pressed="pressed"
    :title="label"
    :aria-label="icon ? label : undefined"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="k-spinner" aria-hidden="true"></span>
    <slot v-if="!(loading && icon)"></slot>
  </button>
</template>
