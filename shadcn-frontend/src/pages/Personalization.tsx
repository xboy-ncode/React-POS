
import { useUI } from '../store/ui'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

const swatches = ['#6366F1','#3B82F6','#22C55E','#06B6D4','#F59E0B','#EF4444','#A855F7']

export default function Personalization() {
  const { t } = useTranslation()
  const { accent, setAccent } = useUI()
  return (
    <Card className="p-4 max-w-xl">
      <h2 className="text-lg font-semibold mb-3">{t('app.personalization')}</h2>
      <div className="flex gap-2">
        {swatches.map((c) => (
          <Button
            key={c}
            variant={accent === c ? "default" : "outline"}
            size="icon"
            style={{ background: c, borderColor: accent === c ? c : undefined }}
            onClick={() => setAccent(c)}
            className="rounded-full border"
          />
        ))}
      </div>
    </Card>
  )
}
