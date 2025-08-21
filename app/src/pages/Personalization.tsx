
import { useUI } from '../store/ui'
import { useTranslation } from 'react-i18next'

const swatches = ['#6366F1','#3B82F6','#22C55E','#06B6D4','#F59E0B','#EF4444','#A855F7']

export default function Personalization() {
  const { t } = useTranslation()
  const { accent, setAccent } = useUI()
  return (
    <div className="card p-4 max-w-xl">
      <h2 className="text-lg font-semibold mb-3">{t('app.personalization')}</h2>
      <div className="flex gap-2">
        {swatches.map((c) => (
          <button key={c} className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700" style={{ background: c, outline: accent===c ? '3px solid rgba(0,0,0,0.2)' : 'none' }} onClick={() => setAccent(c)} />
        ))}
      </div>
    </div>
  )
}
