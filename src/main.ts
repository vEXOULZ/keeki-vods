import '@vexoulz/ui/fonts.css'
import '@vexoulz/ui/style.css'
import '@vexoulz/platform-web/style.css'
import '@vexoulz/vods-core/app.css'

import { createVodsApp } from '@vexoulz/vods-core/app'
import { site, vodsConfig } from './vods.config'

createVodsApp({
  config: vodsConfig,
  site,
  adminBase: import.meta.env.VITE_ADMIN_API || '/backend-admin',
  // Off until this site is registered with vexoulz-auth.
  authBase: import.meta.env.VITE_AUTH_BASE ?? '',
  commit: __COMMIT__,
}).app.mount('#app')
