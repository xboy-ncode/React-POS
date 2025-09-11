import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'

const schema = z.object({
  nombre_usuario: z.string().min(1, 'Username is required'),
  clave: z.string().min(4, 'Password must be at least 4 characters')
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const signIn = useAuth((s) => s.signIn)
  const navigate = useNavigate()

  const onSubmit = async (values: FormData) => {
    try {
      await signIn(values)
      navigate('/')
    } catch (e) {
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <Card className="p-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">{t('app.sign_in')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('app.signin_tagline')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nombre_usuario">{t('Username') || 'Username'}</Label>
            <Input id="nombre_usuario" type="text" placeholder="username" {...register('nombre_usuario')} />
            {errors.nombre_usuario && <p className="text-xs text-red-500 mt-1">{errors.nombre_usuario.message}</p>}
          </div>
          <div>
            <Label htmlFor="clave">{t('app.password')}</Label>
            <Input id="clave" type="password" placeholder="••••••••" {...register('clave')} />
            {errors.clave && <p className="text-xs text-red-500 mt-1">{errors.clave.message}</p>}
          </div>
          <Button disabled={isSubmitting} className="w-full" type="submit" variant="default">{t('app.sign_in')}</Button>
        </form>
      </Card>
    </div>
  )
}