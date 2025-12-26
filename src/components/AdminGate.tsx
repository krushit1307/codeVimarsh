import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isAdmin } = useAdminAuth();
  if (!isAdmin) return null;
  return <>{children}</>;
};

export default AdminGate;
