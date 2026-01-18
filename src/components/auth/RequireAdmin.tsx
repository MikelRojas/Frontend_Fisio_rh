import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/lib/AuthContext"

export default function RequireAdmin() {
  const { isLoading, isAuthenticated, user } = useAuth()

  if (isLoading) return null 
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== "admin") return <Navigate to="/" replace />

  return <Outlet />
}
