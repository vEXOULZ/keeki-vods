// The shared *.vexoul.net sign-in (vexoulz-auth), from this site's side: the same session as vods.vexoul.net and the
// others. The service holds one session for every site (a cookie on its own host, which credentialed fetches carry),
// so signing in there signs in here too. This is @vexoulz/ui/account's logic without its UI, which this site doesn't
// use; keep the two in step.
import { computed, inject, readonly, ref, type App, type ComputedRef, type InjectionKey, type Ref } from 'vue'

/** The signed-in user, as vexoulz-auth's `/v1/me` answers. */
export interface AuthUser {
  id: string
  login: string
  displayName: string
  avatar: string | null
  /** Twitch chat colour, if they set one. */
  color: string | null
}

export interface Account {
  /** False when no auth service is configured: the site is always signed out. */
  readonly enabled: boolean
  /** The service's base URL, without a trailing slash ('' when disabled). */
  readonly base: string
  readonly user: Readonly<Ref<AuthUser | null>>
  readonly signedIn: ComputedRef<boolean>
  /** True once the first `/v1/me` answered (or failed): until then a signed-out look may be wrong. */
  readonly ready: Readonly<Ref<boolean>>
  /** Asks the service who is signed in. A failed request keeps what was known. */
  refresh(): Promise<AuthUser | null>
  /** Sends the page through Twitch (or straight back, if already signed in) to `returnTo` (default: here). */
  signIn(returnTo?: string): void
  /** Ends this browser's session, or every session of the user on every site. */
  signOut(opts?: { everywhere?: boolean }): Promise<void>
  /** A credentialed request to the service, with the CSRF header on writes. */
  request(path: string, init?: RequestInit): Promise<Response>
  install(app: App): void
}

export const CSRF_HEADER = 'X-Vexoulz-CSRF'
const ACCOUNT_KEY: InjectionKey<Account> = Symbol('k-account')
/** How stale the known user may be before a tab coming back into view asks again. */
const RECHECK_MS = 60_000

export function createAccount(authBase?: string | null): Account {
  const base = (authBase ?? '').trim().replace(/\/+$/, '')
  const enabled = base !== ''

  const user = ref<AuthUser | null>(null)
  const ready = ref(!enabled)
  let token: string | null = null
  let checkedAt = -Infinity
  let pending: Promise<AuthUser | null> | null = null

  function request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)
    const method = (init.method ?? 'GET').toUpperCase()
    if (method !== 'GET' && method !== 'HEAD' && token) headers.set(CSRF_HEADER, token)
    return fetch(base + path, { ...init, headers, credentials: 'include' })
  }

  async function check(): Promise<AuthUser | null> {
    try {
      const res = await request('/v1/me', { headers: { Accept: 'application/json' } })
      if (res.ok) {
        const body = await res.json()
        token = body.csrf ?? null
        user.value = {
          id: String(body.id),
          login: body.login,
          displayName: body.displayName || body.login,
          avatar: body.avatar ?? null,
          color: body.color ?? null,
        }
      } else if (res.status === 401) {
        token = null
        user.value = null
      }
      checkedAt = Date.now()
    } catch {
      // Unreachable: keep what we had and try again next time.
    } finally {
      ready.value = true
    }
    return user.value
  }

  function refresh(): Promise<AuthUser | null> {
    if (!enabled) return Promise.resolve(null)
    pending ??= check().finally(() => (pending = null))
    return pending
  }

  function signIn(returnTo?: string) {
    if (!enabled) return
    window.location.assign(`${base}/login?return=${encodeURIComponent(returnTo ?? window.location.href)}`)
  }

  async function signOut(opts: { everywhere?: boolean } = {}) {
    if (!enabled) return
    try {
      await request(opts.everywhere ? '/v1/logout?everywhere=1' : '/v1/logout', { method: 'POST' })
    } finally {
      token = null
      user.value = null
    }
  }

  const account: Account = {
    enabled,
    base,
    user: readonly(user) as Readonly<Ref<AuthUser | null>>,
    signedIn: computed(() => !!user.value),
    ready: readonly(ready),
    refresh,
    signIn,
    signOut,
    request,
    install(app: App) {
      app.provide(ACCOUNT_KEY, account)
      if (!enabled || typeof document === 'undefined') return
      void refresh()
      // Signing out everywhere on another site shows up here when the tab comes back into view.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - checkedAt >= RECHECK_MS) void refresh()
      })
    },
  }
  return account
}

/**
 * vexoulz-auth's URL. VITE_AUTH_BASE overrides it: a copy hosted elsewhere points it at its own, or sets it empty,
 * which turns sign-in off (the header's "Sign in" is greyed out and progress stays in the browser).
 */
export const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? 'https://auth.vexoul.net'

export const account = createAccount(AUTH_BASE)

export function useAccount(): Account {
  return inject(ACCOUNT_KEY, account)
}
