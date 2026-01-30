import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
import Home from './components/Home';
import HomeTripAdvisor from './components/HomeTripAdvisor';
import AuthModal from './components/AuthModal';
import MobileNav from './components/MobileNav';
import Navigation from './components/Navigation';
import MasterDetail from './pages/MasterDetail';
import TournamentDetail from './pages/TournamentDetail';
import ClubDetail from './pages/ClubDetail';
import PlayerDetail from './pages/PlayerDetail';
import MastersList from './pages/MastersList';
import TournamentsList from './pages/TournamentsList';
import ClubsList from './pages/ClubsList';
import PlayersList from './pages/PlayersList';
import LocationsList from './pages/LocationsList';
import LocationDetail from './pages/LocationDetail';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import GamesList from './pages/GamesList';
import Dashboard from './pages/Dashboard';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmation from './pages/BookingConfirmation';
import TournamentPayment from './pages/TournamentPayment';
import TournamentConfirmation from './pages/TournamentConfirmation';
import ClubPayment from './pages/ClubPayment';
import ClubConfirmation from './pages/ClubConfirmation';
import VenueRegistration from './pages/VenueRegistration';
import VenueSubmitted from './pages/VenueSubmitted';
import AdminVenues from './pages/AdminVenues';
import CreateTournament from './pages/CreateTournament';
import CreateClub from './pages/CreateClub';
import HomeRoam from './pages/HomeRoam';
import NotFound from './pages/NotFound';
import { useStore } from './store';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const authInitialized = useStore((state) => state.authInitialized);

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show loading state until auth is initialized to prevent layout shift
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-chess-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-chess-gold border-t-transparent"></div>
      </div>
    );
  }

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Dispatch custom event that Home component listens for
        window.dispatchEvent(new CustomEvent('openSearch'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-chess-darker pb-20 md:pb-0">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomeTripAdvisor />} />
          <Route path="/original" element={<Home />} />
          <Route path="/live" element={<HomeRoam />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
          <Route path="/tournament-payment" element={<ProtectedRoute><TournamentPayment /></ProtectedRoute>} />
          <Route path="/tournament-confirmation" element={<ProtectedRoute><TournamentConfirmation /></ProtectedRoute>} />
          <Route path="/club-payment" element={<ProtectedRoute><ClubPayment /></ProtectedRoute>} />
          <Route path="/club-confirmation" element={<ProtectedRoute><ClubConfirmation /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/masters" element={<MastersList />} />
          <Route path="/master/:id" element={<MasterDetail />} />
          <Route path="/tournaments" element={<TournamentsList />} />
          <Route path="/tournaments/create" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
          <Route path="/tournament/:id" element={<TournamentDetail />} />
          <Route path="/clubs" element={<ClubsList />} />
          <Route path="/clubs/create" element={<ProtectedRoute><CreateClub /></ProtectedRoute>} />
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/players" element={<PlayersList />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/locations" element={<LocationsList />} />
          <Route path="/location/:id" element={<LocationDetail />} />
          <Route path="/games" element={<GamesList />} />
          <Route path="/register-venue" element={<VenueRegistration />} />
          <Route path="/venue-submitted" element={<ProtectedRoute><VenueSubmitted /></ProtectedRoute>} />
          <Route path="/admin/venues" element={<ProtectedRoute><AdminVenues /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AuthModal />
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
