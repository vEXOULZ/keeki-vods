// keeki-vods has its own look. From @vex/ui it takes only the headless logic (`/utils`, `/account`), never the
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

/** The `Vx*` names a module imports from @vex/ui (any path). */
function vxNames(source: string): string[] {
  const found: string[] = []
  for (const [, names] of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]@vex\/ui[^'"]*['"]/g))
    found.push(...names!.split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]!).filter((n) => /^Vx[A-Z]/.test(n)))
  return found
}

/** Why a specifier is not allowed here, or null. */
function forbidden(spec: string): string | null {
  if (spec.startsWith('@vex/ui')) {
    if (spec === '@vex/ui/utils' || spec === '@vex/ui/account') return null
    return `@vex/ui: only /utils and /account (got ${spec})`
  }
  if (/^@vex\/vods-core\/(app|app\.css)(\/|$)/.test(spec)) return `vods-core's app entry (got ${spec})`
  return null
}

function violations(source: string): string[] {
  return [
    ...specifiers(source).map(forbidden).filter((v): v is string => !!v),
    ...vxNames(source).map((n) => `a Vx component from @vex/ui (${n})`),
  ]
}

function sources(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.(ts|vue|css)$/.test(e.name))
    .map((e) => join(e.parentPath, e.name))
}

describe('headless only', () => {
  it("imports nothing but @vex/ui's /utils and /account, and nothing from vods-core's app entry", () => {
    const files = [...sources(join(ROOT, 'src')), join(ROOT, 'index.html')]
    expect(files.length).toBeGreaterThan(50)
    const bad = files.flatMap((f) => violations(readFileSync(f, 'utf8')).map((v) => `${relative(ROOT, f)}: ${v}`))
    expect(bad).toEqual([])
  })

  it('catches the root, a Vx component, the styles and the app entry', () => {
    expect(violations(`import { useToast } from '@vex/ui/utils'\nimport { createAccount } from '@vex/ui/account'`)).toEqual([])
    expect(violations(`import { clamp } from '@vex/ui'`)).toHaveLength(1)
    expect(violations(`import { VxButton } from '@vex/ui/utils'`)).toEqual(['a Vx component from @vex/ui (VxButton)'])
    expect(violations(`import '@vex/ui/style.css'`)).toHaveLength(1)
    expect(violations(`@import '@vex/ui/fonts.css';`)).toHaveLength(1)
    expect(violations(`const P = () => import('@vex/ui')`)).toHaveLength(1)
    expect(violations(`import { WatchView } from '@vex/vods-core/app'`)).toHaveLength(1)
    expect(violations(`import '@vex/vods-core/app.css'`)).toHaveLength(1)
  })
})
