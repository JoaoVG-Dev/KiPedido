import { KeyRound, LogIn } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

export function LoginPage() {
  usePageTitle('Login administrativo')

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

        <form className="login-form">
          <label>
            Email
            <input type="email" defaultValue="admin@kipedido.local" autoComplete="email" />
          </label>
          <label>
            Senha
            <input type="password" defaultValue="KiPedido@123" autoComplete="current-password" />
          </label>
          <button className="primary-button" type="button">
            <LogIn size={18} />
            Entrar
          </button>
        </form>

        <div className="login-note">
          <KeyRound size={18} />
          <span>Use as credenciais de teste criadas pelo seeder inicial.</span>
        </div>
      </section>
    </main>
  )
}
