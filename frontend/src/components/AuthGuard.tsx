import { Navigate, Outlet } from "react-router-dom";

export function AuthGuard() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/auth" replace />;
}
