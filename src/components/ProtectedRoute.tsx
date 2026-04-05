import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const role = localStorage.getItem("cmf_role");
      if (!role || !allowedRoles.includes(role)) { setLoading(false); return; }

      if (role === "admin") {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!data) { setLoading(false); return; }
      }

      if (role === "agent") {
        const { data } = await supabase
          .from("agents")
          .select("approval_status")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!data || data.approval_status !== "approved") { setLoading(false); return; }
      }

      setAuthorized(true);
      setLoading(false);
    };
    checkAuth();
  }, [allowedRoles]);

  if (loading) return null;
  if (!authorized) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
