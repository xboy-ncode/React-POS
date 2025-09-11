

import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

const swatches = ['#6366F1','#3B82F6','#22C55E','#06B6D4','#F59E0B','#EF4444','#A855F7']

export default function Personalization() {
  const { t } = useTranslation()

  return (
    <Card className="p-4 max-w-xl">
      <h2 className="text-lg font-semibold mb-3">{t('app.personalization')}</h2>
      <div className="flex gap-2">
        {swatches.map((c) => (
          <Button
            key={c}

            size="icon"


            className="rounded-full border"
          />
        ))}
      </div>
    </Card>
  )
}
