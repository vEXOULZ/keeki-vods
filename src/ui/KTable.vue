<script setup lang="ts" generic="Row extends Record<string, unknown>">
// A data table. On a narrow screen every column stays and the table scrolls sideways. Custom cells:
// <template #cell-status="{ row, value }">. Sorting is local unless `manual`, when the page sorts from v-model:sort.
import { computed } from 'vue'
import type { SortState, TableColumn } from './types'

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    rows: Row[]
    rowKey?: keyof Row & string
    manual?: boolean
    empty?: string
    label?: string
  }>(),
  { manual: false, empty: 'Nothing here yet.' },
)
const sort = defineModel<SortState | null>('sort', { default: null })

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
const sorted = computed(() => {
  const s = sort.value
  if (props.manual || !s) return props.rows
  const k = s.key
  const out = [...props.rows].sort((a, b) => {
    const x = a[k]
    const y = b[k]
    if (typeof x === 'number' && typeof y === 'number') return x - y
    return collator.compare(String(x ?? ''), String(y ?? ''))
  })
  return s.dir === 'desc' ? out.reverse() : out
})

function toggle(c: TableColumn) {
  if (!c.sortable) return
  const s = sort.value
  sort.value = s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' }
}
const ariaSort = (c: TableColumn) =>
  !c.sortable ? undefined : sort.value?.key === c.key ? (sort.value.dir === 'asc' ? 'ascending' : 'descending') : 'none'
const cellClass = (c: TableColumn) => ({ 'is-right': c.align === 'right', 'is-mono': c.mono, 'is-muted': c.muted })
const keyOf = (row: Row, i: number) => (props.rowKey ? String(row[props.rowKey]) : i)
</script>

<template>
  <div class="k-table-wrap" tabindex="0" role="region" :aria-label="label ?? 'Table'">
    <table class="k-table">
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            :class="[cellClass(c), { 'is-sortable': c.sortable }]"
            :style="{ width: c.width }"
            :aria-sort="ariaSort(c)"
            :tabindex="c.sortable ? 0 : undefined"
            scope="col"
            @click="toggle(c)"
            @keydown.enter.space.prevent="toggle(c)"
          >{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in sorted" :key="keyOf(row, i)">
          <td v-for="c in columns" :key="c.key" :class="cellClass(c)">
            <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">{{ row[c.key] }}</slot>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="is-muted">{{ empty }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
