import type {ReactNode} from 'react';
import { Navigate, useLocation } from 'react-router';
import { isAuthenticated } from '../../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuth = isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}