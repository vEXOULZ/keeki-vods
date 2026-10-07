<script setup lang="ts">
// A small boxed label. `k` is a "key value" chip's key ("streamed Mon 5 Oct"); `clickable` makes it a toggle.
withDefaults(
  defineProps<{ tone?: 'default' | 'accent' | 'ok' | 'warn' | 'bad'; clickable?: boolean; active?: boolean; k?: string }>(),
  { tone: 'default', clickable: false, active: false },
)
defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <button
    v-if="clickable"
    type="button"
    class="k-chip"
    :class="[tone !== 'default' && `is-${tone}`, { 'is-active': active }]"
    :aria-pressed="active"
    @click="$emit('click', $event)"
  ><span v-if="k" class="k-chip-key">{{ k }}</span><slot></slot></button>
  <span v-else class="k-chip" :class="tone !== 'default' && `is-${tone}`"
    ><span v-if="k" class="k-chip-key">{{ k }}</span><slot></slot></span
  >
</template>
