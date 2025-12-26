import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isLoading, isAdmin } = useAdminAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
