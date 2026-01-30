import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    // Redirect to login page and save the attempted location
    // After login, user will be redirected back to this location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
