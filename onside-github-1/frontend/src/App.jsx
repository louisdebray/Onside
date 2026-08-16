import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FavoritesProvider } from './hooks/FavoritesContext'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { ScoresPage } from './pages/ScoresPage'
import { StandingsPage } from './pages/StandingsPage'
import { FixturesPage } from './pages/FixturesPage'
import { TransfersPage } from './pages/TransfersPage'
import { MarketValuesPage } from './pages/MarketValuesPage'
import { ScoutingPage } from './pages/ScoutingPage'
import { PlayerPage } from './pages/PlayerPage'
import { RumorsPage } from './pages/RumorsPage'
import { NewsPage } from './pages/NewsPage'
import { AdminPage } from './pages/AdminPage'

// En dev le site est servi depuis "/", mais sur GitHub Pages depuis "/Onside/" —
// sans ce basename, React Router ne reconnaît pas l'URL de base réelle : la page
// d'accueil restait vide et "Accueil" n'était jamais actif dans le menu.
const basename = import.meta.env.PROD ? '/Onside' : '/'

export default function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter basename={basename}>
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/market-values" element={<MarketValuesPage />} />
            <Route path="/scouting" element={<ScoutingPage />} />
            <Route path="/players/:id" element={<PlayerPage />} />
            <Route path="/rumors" element={<RumorsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </FavoritesProvider>
  )
}
