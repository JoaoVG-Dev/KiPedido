import { KeyRound, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { StateMessage } from '../../components/shared/StateMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { login } from '../../services/auth'

export function LoginPage() {
  usePageTitle('Login administrativo')
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@kipedido.local')
  const [password, setPassword] = useState('KiPedido@123')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/admin')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand">
          <span className="brand__mark">K</span>
          <div>
            <strong>KiPedido</strong>
            <small>Acesso administrativo</small>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error ? <StateMessage title={error} tone="error" /> : null}

        <div className="login-note">
          <KeyRound size={18} />
          <span>Use as credenciais de teste criadas pelo seeder inicial.</span>
        </div>
      </section>
    </main>
  )
}
