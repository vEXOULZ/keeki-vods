// The shapes the controls share (the same as vexoulz-ui's, so Manage's pages port across unchanged).

/** One choice in a select, tab row or segmented control. */
export interface Option<T extends string | number = string> {
  value: T
  label: string
  /** Muted text on the right of a menu row. */
  sub?: string
  disabled?: boolean
  title?: string
}

/** One column of a KTable. */
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right'
  mono?: boolean
  muted?: boolean
  width?: string
}

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}
