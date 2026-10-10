// keeki-vods has its own look. From @vexoulz/ui it takes only the headless logic (`/utils`, `/account`), never the
// components or styles; from vods-core it never takes the `/app` entry (vods.vexoul.net's pages) or its CSS.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The package specifiers a module names: `import … from`, bare `import '…'`, `import('…')`, and CSS `@import`. */
function specifiers(source: string): string[] {
  const found: string[] = []
  for (const re of [/\bfrom\s+['"]([^'"]+)['"]/g, /(?<!@)\bimport\s*\(?\s*['"]([^'"]+)['"]/g, /@import\s+(?:url\()?['"]([^'"]+)['"]/g])
    for (const [, spec] of source.matchAll(re)) found.push(spec!)
  return found
}

/** The `Vx*` names a module imports from @vexoulz/ui (any path). */
function vxNames(source: string): string[] {
  const found: string[] = []
  for (const [, names] of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@vexoulz\/ui[^'"]*['"]/g))
    found.push(...names!.split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]!).filter((n) => /^Vx[A-Z]/.test(n)))
  return found
}

/** Why a specifier is not allowed here, or null. */
function forbidden(spec: string): string | null {
  if (spec.startsWith('@vexoulz/ui')) {
    if (spec === '@vexoulz/ui/utils' || spec === '@vexoulz/ui/account') return null
    return `@vexoulz/ui: only /utils and /account (got ${spec})`
  }
  if (/^@vexoulz\/vods-core\/(app|app\.css)(\/|$)/.test(spec)) return `vods-core's app entry (got ${spec})`
  return null
}

function violations(source: string): string[] {
  return [
    ...specifiers(source).map(forbidden).filter((v): v is string => !!v),
    ...vxNames(source).map((n) => `a Vx component from @vexoulz/ui (${n})`),
  ]
}

function sources(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.(ts|vue|css)$/.test(e.name))
    .map((e) => join(e.parentPath, e.name))
}

describe('headless only', () => {
  it("imports nothing but @vexoulz/ui's /utils and /account, and nothing from vods-core's app entry", () => {
    const files = [...sources(join(ROOT, 'src')), join(ROOT, 'index.html')]
    expect(files.length).toBeGreaterThan(50)
    const bad = files.flatMap((f) => violations(readFileSync(f, 'utf8')).map((v) => `${relative(ROOT, f)}: ${v}`))
    expect(bad).toEqual([])
  })

  it('catches the root, a Vx component, the styles and the app entry', () => {
    expect(violations(`import { useToast } from '@vexoulz/ui/utils'\nimport { createAccount } from '@vexoulz/ui/account'`)).toEqual([])
    expect(violations(`import { clamp } from '@vexoulz/ui'`)).toHaveLength(1)
    expect(violations(`import { VxButton } from '@vexoulz/ui/utils'`)).toEqual(['a Vx component from @vexoulz/ui (VxButton)'])
    expect(violations(`import '@vexoulz/ui/style.css'`)).toHaveLength(1)
    expect(violations(`@import '@vexoulz/ui/fonts.css';`)).toHaveLength(1)
    expect(violations(`const P = () => import('@vexoulz/ui')`)).toHaveLength(1)
    expect(violations(`import { WatchView } from '@vexoulz/vods-core/app'`)).toHaveLength(1)
    expect(violations(`import '@vexoulz/vods-core/app.css'`)).toHaveLength(1)
  })
})
