<script setup lang="ts">
// A VOD with no thumbnail: a frame of film leader (crosshair and rings, "No picture" on a slate in the middle). One
// SVG, so it fills any 16:9 box and scales from a card down to the end card's preview.
withDefaults(defineProps<{ label?: string }>(), { label: 'No thumbnail' })
</script>

<template>
  <div class="k-nopic" role="img" :aria-label="label">
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g class="lines">
        <line x1="0" y1="45" x2="160" y2="45" />
        <line x1="80" y1="0" x2="80" y2="90" />
        <circle cx="80" cy="45" r="33" />
        <circle cx="80" cy="45" r="27" />
      </g>
      <rect class="slate" x="48" y="37" width="64" height="16" />
      <text class="word" x="80" y="45">No picture</text>
    </svg>
  </div>
</template>
