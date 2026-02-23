import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import SearchPage from './features/search/SearchPage';
import DetailsPage from './features/details/DetailsPage';
import DashboardPage from './features/dashboard/DashboardPage';
import { LibraryProvider } from './contexts/LibraryContext';

export default function App() {
  return (
    <LibraryProvider>
      <BrowserRouter>
        <div className="app">
          <a href="#main-content" className="app__skip-link">
            Skip to content
          </a>
          <header className="app__header">
            <Link to="/" className="app__brand">
              <span className="app__logo">TS</span>
              <span>TV Series Module</span>
            </Link>
            <nav className="app__nav" aria-label="Main navigation">
              <Link to="/">Discover</Link>
              <Link to="/dashboard">Dashboard</Link>
            </nav>
          </header>
          <main id="main-content" className="app__content">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/shows/:id" element={<DetailsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LibraryProvider>
  );
}
