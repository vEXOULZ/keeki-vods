/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The archive API's base URL (default `/backend` on the same origin). */
  readonly VITE_ARCHIVE_API?: string
  /** The worker admin API's base URL, for the Manage pages (default `/backend-admin` on the same origin). */
  readonly VITE_ADMIN_API?: string
  /**
   * vexoulz-auth, the sign-in shared by the vexoul.net sites (default: https://auth.vexoul.net). Empty turns sign-in
   * off: progress stays in the browser.
   */
  readonly VITE_AUTH_BASE?: string
  /** Dev only (vite.config.ts): where `/backend` is forwarded. */
  readonly VITE_DEV_API_TARGET?: string
  /** Dev only (vite.config.ts): where `/backend-admin` is forwarded; unset uses the mock (@vexoulz/vods-core/dev). */
  readonly VITE_DEV_ADMIN_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** The commit this build comes from (vite.config.ts). */
declare const __COMMIT__: string
