
import { useTranslation } from 'react-i18next'
import { useUI } from '../../store/ui'
import { useAuth } from '../../store/auth'
import { Button } from '../ui/button'


export default function Topbar() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useUI()
  const { user, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>←</Button>
        <span className="font-medium">{t('app.title')}</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Language"
          className="input w-28"
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value) }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <select
          aria-label="Theme"
          className="input w-28"
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
        >
          <option value="system">{t('app.system')}</option>
          <option value="light">{t('app.light')}</option>
          <option value="dark">{t('app.dark')}</option>
        </select>

        <div className="text-sm text-muted-foreground">{user?.name ? user.name.toUpperCase() : "Invitado"}</div>
        <Button variant="outline" size="sm" onClick={() => signOut()}>{t('app.logout')}</Button>
      </div>
    </header>
  )
}
