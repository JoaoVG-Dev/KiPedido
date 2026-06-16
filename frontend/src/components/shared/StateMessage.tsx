import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../services/api'

type StateMessageProps = {
  title: string
  description?: string
  tone?: 'loading' | 'error' | 'empty' | 'success'
  action?: {
    to: string
    label: string
  }
}

export function StateMessage({ title, description, tone = 'empty', action }: StateMessageProps) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'loading' ? Loader2 : AlertCircle

  return (
    <div className={`state-message state-message--${tone}`}>
      <Icon size={22} className={tone === 'loading' ? 'state-message__spinner' : undefined} />
      <div>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      {action ? <Link className="secondary-button" to={action.to}>{action.label}</Link> : null}
    </div>
  )
}

export function ApiStateMessage({ error }: { error: Error }) {
  if (error instanceof ApiError && error.status === 401) {
    return (
      <StateMessage
        title="Faça login para carregar estes dados."
        description="As rotas administrativas, da cozinha e do caixa usam Sanctum."
        tone="error"
        action={{ to: '/admin/login', label: 'Entrar' }}
      />
    )
  }

  return <StateMessage title={error.message} tone="error" />
}
