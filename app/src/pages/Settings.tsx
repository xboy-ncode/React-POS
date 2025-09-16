import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import { useTheme } from '@/components/ThemeProvider'
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Circle
} from 'lucide-react'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()

  // Settings state
  const [notifications, setNotifications] = useState(() =>
    localStorage.getItem('notifications') === 'true'
  )
  const [autoSave, setAutoSave] = useState(() =>
    localStorage.getItem('autoSave') !== 'false' // default to true
  )
  const [compactMode, setCompactMode] = useState(() =>
    localStorage.getItem('compactMode') === 'true'
  )
  const [soundEffects, setSoundEffects] = useState(() =>
    localStorage.getItem('soundEffects') === 'true'
  )
  const [fontSize, setFontSize] = useState(() =>
    localStorage.getItem('fontSize') || 'medium'
  )

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', notifications.toString())
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('autoSave', autoSave.toString())
  }, [autoSave])

  useEffect(() => {
    localStorage.setItem('compactMode', compactMode.toString())
  }, [compactMode])

  useEffect(() => {
    localStorage.setItem('soundEffects', soundEffects.toString())
  }, [soundEffects])

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize)
    // Apply font size class to document
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg')
    const fontClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
    document.documentElement.classList.add(fontClass)
  }, [fontSize])

  const handleClearData = () => {
    if (window.confirm(t('settings.confirmClearData'))) {
      // Clear specific app data but keep theme and language preferences
      const keysToKeep = ['vite-ui-theme', 'lang']
      const keysToRemove = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      window.location.reload()
    }
  }

  const handleExportSettings = () => {
    const settings = {
      theme,
      language: i18n.language,
      notifications,
      autoSave,
      compactMode,
      soundEffects,
      fontSize
    }

    const dataStr = JSON.stringify(settings, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'app-settings.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getColorThemeColor = (colorTheme: string) => {
    switch (colorTheme) {
      case "orange": return "#ff6b35"
      case "rose": return "#e11d48"
      case "green": return "#22c55e"
      case "blue": return "#3b82f6"
      case "violet": return "#8b5cf6"
      default: return "#ff6b35"
    }
  }


  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      case 'system': return <Monitor className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const SettingItem = ({ icon, title, description, children }) => (
    <div className="flex items-center justify-between space-x-4 py-3">
      <div className="flex items-start space-x-3 flex-1">
        <div className="mt-0.5 text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.appearance')}
          </CardTitle>
          <CardDescription>
            {t('settings.appearanceDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingItem
            icon={getThemeIcon(theme)}
            title={t('settings.mode')}
            description={t('settings.modeDescription')}
          >
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t('theme.light')}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t('theme.dark')}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t('theme.system')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingItem>

          <Separator />

          <SettingItem
            icon={<Circle className="h-4 w-4" style={{ color: getColorThemeColor(colorTheme) }} />}
            title={t('settings.colorTheme')}
            description={t('settings.colorThemeDescription')}
          >
            <Select value={colorTheme} onValueChange={setColorTheme}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#ff6b35' }} />
                    {t('colorTheme.orange')}
                  </div>
                </SelectItem>
                <SelectItem value="yellow">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#f0b100' }} />
                    {t('colorTheme.yellow')}
                  </div>
                </SelectItem>
                <SelectItem value="rose">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#e11d48' }} />
                    {t('colorTheme.rose')}
                  </div>
                </SelectItem>
                <SelectItem value="green">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#22c55e' }} />
                    {t('colorTheme.green')}
                  </div>
                </SelectItem>
                <SelectItem value="blue">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#3b82f6' }} />
                    {t('colorTheme.blue')}
                  </div>
                </SelectItem>
                <SelectItem value="violet">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                    {t('colorTheme.violet')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingItem>


          <Separator />

          <SettingItem
            icon={<Globe className="h-4 w-4" />}
            title={t('settings.language')}
            description={t('settings.languageDescription')}
          >
            <Select
              value={i18n.language}
              onValueChange={(value) => {
                i18n.changeLanguage(value)
                localStorage.setItem('lang', value)
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </SettingItem>

          <Separator />

          <SettingItem
            icon={<Smartphone className="h-4 w-4" />}
            title={t('settings.fontSize')}
            description={t('settings.fontSizeDescription')}
          >
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t('fontSize.small')}</SelectItem>
                <SelectItem value="medium">{t('fontSize.medium')}</SelectItem>
                <SelectItem value="large">{t('fontSize.large')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingItem>

          <Separator />

          <SettingItem
            icon={<Monitor className="h-4 w-4" />}
            title={t('settings.compactMode')}
            description={t('settings.compactModeDescription')}
          >
            <Switch
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </SettingItem>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.preferences')}
          </CardTitle>
          <CardDescription>
            {t('settings.preferencesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingItem
            icon={<Bell className="h-4 w-4" />}
            title={t('settings.notifications')}
            description={t('settings.notificationsDescription')}
          >
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </SettingItem>

          <Separator />

          <SettingItem
            icon={<RefreshCw className="h-4 w-4" />}
            title={t('settings.autoSave')}
            description={t('settings.autoSaveDescription')}
          >
            <Switch
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </SettingItem>

          <Separator />

          <SettingItem
            icon={<Bell className="h-4 w-4" />}
            title={t('settings.soundEffects')}
            description={t('settings.soundEffectsDescription')}
          >
            <Switch
              checked={soundEffects}
              onCheckedChange={setSoundEffects}
            />
          </SettingItem>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('settings.dataManagement')}
          </CardTitle>
          <CardDescription>
            {t('settings.dataManagementDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportSettings}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('settings.exportSettings')}
            </Button>

            <Button
              onClick={handleClearData}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('settings.clearData')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('settings.dataManagementNote')}
          </p>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
            <div>
              {t('settings.version')}: 1.0.0 | {t('settings.lastUpdated')}: {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">
                {t('settings.privacy')}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t('settings.terms')}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t('settings.support')}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}