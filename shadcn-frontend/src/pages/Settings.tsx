
import { useTranslation } from 'react-i18next'
import { useUI } from '../store/ui'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useUI()

  return (
    <div className="grid gap-4 max-w-2xl">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">{t('app.language')}</h2>
        <select
          className="input w-40"
          value={i18n.language}
          onChange={(e) => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value) }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </Card>
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">{t('app.theme')}</h2>
        <div className="flex gap-2">
          <Button variant={theme==='system'?'default':'outline'} onClick={() => setTheme('system')}>{t('app.system')}</Button>
          <Button variant={theme==='light'?'default':'outline'} onClick={() => setTheme('light')}>{t('app.light')}</Button>
          <Button variant={theme==='dark'?'default':'outline'} onClick={() => setTheme('dark')}>{t('app.dark')}</Button>
        </div>
      </Card>
    </div>
  )
}
