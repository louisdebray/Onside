import { NavLink } from 'react-router-dom'
import { useFavoritesContext } from '../hooks/FavoritesContext'
import { classNames } from '../domain/formatters'
import logo from '../assets/logo-onside.png'

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/scores', label: 'Scores' },
  { to: '/standings', label: 'Classements' },
  { to: '/fixtures', label: 'Calendrier' },
  { to: '/transfers', label: 'Transferts' },
  { to: '/market-values', label: 'Valeurs marchandes' },
  { to: '/scouting', label: 'Scouting' },
  { to: '/rumors', label: 'Rumeurs' },
  { to: '/news', label: 'Actu' },
]

export function Navbar() {
  const { onlyFavorites, setOnlyFavorites } = useFavoritesContext()

  return (
    <header className="app-navbar sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <NavLink to="/" end className="flex shrink-0 items-center">
          <img src={logo} alt="Onside" className="h-8 w-auto shrink-0 rounded-md" />
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                classNames(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent/15 text-accent' : 'text-white/60 hover:text-white/90',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyFavorites((v) => !v)}
            className={classNames(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              onlyFavorites
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80',
            )}
          >
            ★ Mon club favori
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-5 py-2 md:hidden">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              classNames(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                isActive ? 'bg-accent/15 text-accent' : 'text-white/60',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
