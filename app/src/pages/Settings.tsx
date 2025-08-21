
import { useTranslation } from 'react-i18next'
import { useUI } from '../store/ui'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useUI()

  return (
    <div className="grid gap-4 max-w-2xl">
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">{t('app.language')}</h2>
        <select
          className="input w-40"
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value) }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-3">{t('app.theme')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setTheme('system')} className={`btn ${theme==='system'?'btn-primary':'btn-outline'}`}>{t('app.system')}</button>
          <button onClick={() => setTheme('light')} className={`btn ${theme==='light'?'btn-primary':'btn-outline'}`}>{t('app.light')}</button>
          <button onClick={() => setTheme('dark')} className={`btn ${theme==='dark'?'btn-primary':'btn-outline'}`}>{t('app.dark')}</button>
        </div>
      </div>
    </div>
  )
}
