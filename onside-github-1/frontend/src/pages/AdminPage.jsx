import { useState } from 'react'
import { LoginForm } from '../components/admin/LoginForm'
import { CompetitionsManager } from '../components/admin/CompetitionsManager'
import { SourceTiersManager } from '../components/admin/SourceTiersManager'

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoginForm onSuccess={() => setAuthenticated(true)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Administration</h1>
      <CompetitionsManager />
      <SourceTiersManager />
    </div>
  )
}
