import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TournamentsList from './pages/tournaments/TournamentsList';
import TournamentDetail from './pages/tournaments/TournamentDetail';
import TournamentParticipants from './pages/tournaments/TournamentParticipants';
import TournamentPairings from './pages/tournaments/TournamentPairings';
import TournamentAutomatedTest from './pages/tournaments/TournamentAutomatedTest';
import ClubsList from './pages/clubs/ClubsList';
import ClubDetail from './pages/clubs/ClubDetail';
import ClubMembers from './pages/clubs/ClubMembers';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import FinancialReports from './pages/financials/FinancialReports';
import PairingsTest from './components/pairings/PairingsTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <Layout>
                <TournamentsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TournamentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id/participants"
          element={
            <ProtectedRoute>
              <Layout>
                <TournamentParticipants />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id/pairings"
          element={
            <ProtectedRoute>
              <Layout>
                <TournamentPairings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs"
          element={
            <ProtectedRoute>
              <Layout>
                <ClubsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ClubDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clubs/:id/members"
          element={
            <ProtectedRoute>
              <Layout>
                <ClubMembers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financials"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancialReports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pairings-test"
          element={
            <ProtectedRoute>
              <Layout>
                <PairingsTest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament-automated-test"
          element={
            <ProtectedRoute>
              <Layout>
                <TournamentAutomatedTest />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
