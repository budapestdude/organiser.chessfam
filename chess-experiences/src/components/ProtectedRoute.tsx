import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    // Redirect to home page, but save the attempted location
    // User can then login and we could redirect them back
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
