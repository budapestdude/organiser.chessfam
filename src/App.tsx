import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { initializeAnalytics } from './utils/analytics';
import { usePageTracking } from './hooks/useAnalytics';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Analytics page tracking
function AnalyticsTracker() {
  usePageTracking();
  return null;
}

// Conditionally show navigation (hide on coming soon page)
function ConditionalNavigation() {
  const { pathname } = useLocation();

  // Hide navigation on coming soon page
  if (pathname === '/coming-soon') {
    return null;
  }

  return <Navigation />;
}

// Conditionally show mobile nav (hide on coming soon page)
function ConditionalMobileNav() {
  const { pathname } = useLocation();

  // Hide mobile nav on coming soon page
  if (pathname === '/coming-soon') {
    return null;
  }

  return <MobileNav />;
}

// Conditionally show footer (hide on coming soon page)
function ConditionalFooter() {
  const { pathname } = useLocation();

  // Hide footer on coming soon page
  if (pathname === '/coming-soon') {
    return null;
  }

  return <Footer />;
}
// Eagerly loaded components (used on most pages)
import AuthModal from './components/AuthModal';
import MobileNav from './components/MobileNav';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { useStore } from './store';
import { useHeartbeat } from './hooks/useHeartbeat';

// Lazy loaded pages for code splitting
const Home = lazy(() => import('./components/Home'));
const HomeTripAdvisor = lazy(() => import('./components/HomeTripAdvisor'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const MasterDetail = lazy(() => import('./pages/MasterDetail'));
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'));
const TournamentPending = lazy(() => import('./pages/TournamentPending'));
const ClubDetail = lazy(() => import('./pages/ClubDetail'));
const PlayerDetail = lazy(() => import('./pages/PlayerDetail'));
const MastersList = lazy(() => import('./pages/MastersList'));
const ProfessionalsList = lazy(() => import('./pages/ProfessionalsList'));
const ProfessionalDetail = lazy(() => import('./pages/ProfessionalDetail'));
const ProfessionalApplication = lazy(() => import('./pages/ProfessionalApplication'));
const TournamentsList = lazy(() => import('./pages/TournamentsList'));
const LocationsAndChallenges = lazy(() => import('./pages/LocationsAndChallenges'));
const ClubsList = lazy(() => import('./pages/ClubsList'));
const PlayersList = lazy(() => import('./pages/PlayersList'));
const LocationDetail = lazy(() => import('./pages/LocationDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
const Favorites = lazy(() => import('./pages/Favorites'));
const GamesList = lazy(() => import('./pages/GamesList'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const TournamentPayment = lazy(() => import('./pages/TournamentPayment'));
const TournamentConfirmation = lazy(() => import('./pages/TournamentConfirmation'));
const ClubPayment = lazy(() => import('./pages/ClubPayment'));
const ClubConfirmation = lazy(() => import('./pages/ClubConfirmation'));
const VenueRegistration = lazy(() => import('./pages/VenueRegistration'));
const EditVenue = lazy(() => import('./pages/EditVenue'));
const VenueSubmitted = lazy(() => import('./pages/VenueSubmitted'));
const AdminVenues = lazy(() => import('./pages/AdminVenues'));
const AdminCommunities = lazy(() => import('./pages/AdminCommunities'));
const AdminMasters = lazy(() => import('./pages/AdminMasters'));
const AdminProfessionalApplications = lazy(() => import('./pages/admin/AdminProfessionalApplications'));
const AdminOwnership = lazy(() => import('./pages/AdminOwnership'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminClubs = lazy(() => import('./pages/admin/AdminClubs'));
const AdminTournaments = lazy(() => import('./pages/admin/AdminTournaments'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));
const AdminChessTitleVerifications = lazy(() => import('./pages/admin/AdminChessTitleVerifications'));
const AdminSeries = lazy(() => import('./pages/admin/AdminSeries'));
const AdminFeedAlgorithm = lazy(() => import('./pages/admin/AdminFeedAlgorithm'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminFAQ = lazy(() => import('./pages/admin/AdminFAQ'));
const AdminEmailTemplates = lazy(() => import('./pages/admin/AdminEmailTemplates'));
const AdminEmailTest = lazy(() => import('./pages/admin/AdminEmailTest'));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const PlatformSettings = lazy(() => import('./pages/admin/PlatformSettings'));
const CreateTournament = lazy(() => import('./pages/CreateTournament'));
const VerifyIdentity = lazy(() => import('./pages/VerifyIdentity'));
const VerifyChessTitle = lazy(() => import('./pages/VerifyChessTitle'));
const EditTournament = lazy(() => import('./pages/EditTournament'));
const MyTournaments = lazy(() => import('./pages/MyTournaments'));
const TournamentParticipants = lazy(() => import('./pages/TournamentParticipants'));
const TournamentSeriesHomepage = lazy(() => import('./pages/TournamentSeriesHomepage'));
const CreateClub = lazy(() => import('./pages/CreateClub'));
const MyClubs = lazy(() => import('./pages/MyClubs'));
const MasterApplication = lazy(() => import('./pages/MasterApplication'));
const Achievements = lazy(() => import('./pages/Achievements'));
const HomeRoam = lazy(() => import('./pages/HomeRoam'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Pricing = lazy(() => import('./pages/Pricing'));
const SubscriptionManagement = lazy(() => import('./pages/SubscriptionManagement'));
const GameRecord = lazy(() => import('./pages/GameRecord'));
const TournamentRecord = lazy(() => import('./pages/TournamentRecord'));
const MyGames = lazy(() => import('./pages/MyGames'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Feed = lazy(() => import('./pages/Feed'));
const FAQ = lazy(() => import('./pages/FAQ'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const HelpGettingStarted = lazy(() => import('./pages/HelpGettingStarted'));
const Guides = lazy(() => import('./pages/Guides'));
const CreateTournamentGuide = lazy(() => import('./pages/guides/CreateTournamentGuide'));
const CreateClubGuide = lazy(() => import('./pages/guides/CreateClubGuide'));
const FindGamesGuide = lazy(() => import('./pages/guides/FindGamesGuide'));
const RegisterVenueGuide = lazy(() => import('./pages/guides/RegisterVenueGuide'));
const BlogsList = lazy(() => import('./pages/BlogsList'));
const CreateBlog = lazy(() => import('./pages/CreateBlog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const AuthorPricingSetup = lazy(() => import('./pages/AuthorPricingSetup'));
const MyAuthorSubscriptions = lazy(() => import('./pages/MyAuthorSubscriptions'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-chess-darker">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        <p className="mt-4 text-white/60">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth();
    // Initialize analytics tracking
    initializeAnalytics();
  }, [initializeAuth]);

  // Send periodic heartbeats to track online status
  useHeartbeat();

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
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsTracker />
        <ConditionalNavigation />
        <div className="min-h-screen bg-chess-darker pb-20 md:pb-0">
          <Suspense fallback={<PageLoader />}>
            <Routes>
          <Route path="/" element={<HomeTripAdvisor />} />
          <Route path="/search" element={<HomeTripAdvisor />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
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
          <Route path="/masters/apply" element={<ProtectedRoute><MasterApplication /></ProtectedRoute>} />
          <Route path="/master/:id" element={<MasterDetail />} />
          <Route path="/professionals" element={<ProfessionalsList />} />
          <Route path="/professionals/apply" element={<ProtectedRoute><ProfessionalApplication /></ProtectedRoute>} />
          <Route path="/professionals/:type" element={<ProfessionalsList />} />
          <Route path="/professional/:id" element={<ProfessionalDetail />} />
          <Route path="/tournaments" element={<TournamentsList />} />
          <Route path="/tournaments/create" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
          <Route path="/tournaments/edit/:id" element={<ProtectedRoute><EditTournament /></ProtectedRoute>} />
          <Route path="/tournaments/:id/participants" element={<TournamentParticipants />} />
          <Route path="/tournament/:id/:slug/series" element={<TournamentSeriesHomepage />} />
          <Route path="/tournament/:id/series" element={<TournamentSeriesHomepage />} />
          <Route path="/my-tournaments" element={<ProtectedRoute><MyTournaments /></ProtectedRoute>} />
          <Route path="/tournament/pending" element={<ProtectedRoute><TournamentPending /></ProtectedRoute>} />
          <Route path="/tournament/:id/:slug" element={<TournamentDetail />} />
          <Route path="/tournament/:id" element={<TournamentDetail />} />
          <Route path="/challenges" element={<LocationsAndChallenges />} />
          <Route path="/locations" element={<LocationsAndChallenges />} />
          <Route path="/clubs" element={<ClubsList />} />
          <Route path="/clubs/create" element={<ProtectedRoute><CreateClub /></ProtectedRoute>} />
          <Route path="/my-clubs" element={<ProtectedRoute><MyClubs /></ProtectedRoute>} />
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/players" element={<PlayersList />} />
          <Route path="/player/:id" element={<PlayerDetail />} />
          <Route path="/location/:id" element={<LocationDetail />} />
          <Route path="/games" element={<GamesList />} />
          <Route path="/my-games" element={<ProtectedRoute><MyGames /></ProtectedRoute>} />
          <Route path="/games/:id/record" element={<GameRecord />} />
          <Route path="/tournaments/:id/record" element={<TournamentRecord />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/register-venue" element={<VenueRegistration />} />
          <Route path="/venues/edit/:id" element={<ProtectedRoute><EditVenue /></ProtectedRoute>} />
          <Route path="/venue-submitted" element={<ProtectedRoute><VenueSubmitted /></ProtectedRoute>} />
          <Route path="/verify-identity" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />
          <Route path="/verify-chess-title" element={<ProtectedRoute><VerifyChessTitle /></ProtectedRoute>} />
          <Route path="/premium" element={<Pricing />} />
          <Route path="/account/subscription" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          {/* New Admin Dashboard with Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="venues" element={<AdminVenues />} />
            <Route path="clubs" element={<AdminClubs />} />
            <Route path="tournaments" element={<AdminTournaments />} />
            <Route path="series" element={<AdminSeries />} />
            <Route path="communities" element={<AdminCommunities />} />
            <Route path="masters" element={<AdminMasters />} />
            <Route path="professional-applications" element={<AdminProfessionalApplications />} />
            <Route path="ownership" element={<AdminOwnership />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="chess-title-verifications" element={<AdminChessTitleVerifications />} />
            <Route path="feed-algorithm" element={<AdminFeedAlgorithm />} />
            <Route path="faq" element={<AdminFAQ />} />
            <Route path="email-templates" element={<AdminEmailTemplates />} />
            <Route path="email-test" element={<AdminEmailTest />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          {/* FAQ and Help Center */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/getting-started" element={<HelpGettingStarted />} />
          <Route path="/help/tournaments" element={<HelpGettingStarted />} />
          <Route path="/help/clubs" element={<HelpGettingStarted />} />
          <Route path="/help/games" element={<HelpGettingStarted />} />
          <Route path="/help/account" element={<HelpGettingStarted />} />
          <Route path="/help/premium" element={<HelpGettingStarted />} />
          <Route path="/help/safety" element={<HelpGettingStarted />} />
          {/* How-To Guides */}
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/create-tournament" element={<CreateTournamentGuide />} />
          <Route path="/guides/create-club" element={<CreateClubGuide />} />
          <Route path="/guides/find-games" element={<FindGamesGuide />} />
          <Route path="/guides/register-venue" element={<RegisterVenueGuide />} />
          {/* Blogs */}
          <Route path="/blogs" element={<BlogsList />} />
          <Route path="/blogs/create" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
          <Route path="/blogs/edit/:id" element={<ProtectedRoute><CreateBlog /></ProtectedRoute>} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          {/* Author Subscriptions */}
          <Route path="/author-pricing-setup" element={<ProtectedRoute><AuthorPricingSetup /></ProtectedRoute>} />
          <Route path="/author-subscriptions" element={<ProtectedRoute><MyAuthorSubscriptions /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
        <AuthModal />
        <ConditionalMobileNav />
        </div>
        <ConditionalFooter />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
