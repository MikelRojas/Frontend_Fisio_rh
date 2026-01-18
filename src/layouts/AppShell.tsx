import { Outlet } from "react-router"
import CustomNavbar from "@/components/NavBar"
import type { NavItem } from "@/components/NavBar"
import { useAuth } from "@/lib/AuthContext"

export default function AppShell() {
  const { user, isAuthenticated, isLoading } = useAuth()

  const navbarItems: NavItem[] = [
    { id: "home", title: "Home", href: "/" },
    { id: "appointments", title: "Citas", href: "/appointment" },
  ]

  if (!isLoading && isAuthenticated && user?.role === "admin") {
    navbarItems.push({id: "planner", title: "Agenda", href:"/planner"})
  }

  if (!isLoading && isAuthenticated && user) {
    navbarItems.push({
      id: "records",
      title: user.role === "admin" ? "Expedientes" : "Expediente",
      href: "/records",
    })
  }

  return (
    <>
      <CustomNavbar items={navbarItems} />
      <main className="p-6">
        <Outlet />
      </main>
    </>
  )
}
