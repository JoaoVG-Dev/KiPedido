import { Download, MonitorSmartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function installApp() {
    if (!installEvent) {
      return
    }

    await installEvent.prompt()
    const choice = await installEvent.userChoice

    if (choice.outcome !== 'dismissed') {
      setInstallEvent(null)
    }
  }

  if (isInstalled || !installEvent) {
    return null
  }

  return (
    <button className="tablet-install-button" type="button" onClick={() => void installApp()}>
      <MonitorSmartphone size={18} />
      <span>Instalar</span>
      <Download size={16} />
    </button>
  )
}
