import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
