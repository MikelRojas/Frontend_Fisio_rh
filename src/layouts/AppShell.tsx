import { Outlet } from "react-router"
import CustomNavbar from "@/components/NavBar"
import type { NavItem } from "@/components/NavBar"
import { useAuth } from "@/lib/AuthContext"
import { motion } from "framer-motion"

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-teal-50 text-slate-800">
      <CustomNavbar items={navbarItems} />
  
      <main className="flex-1 px-8 py-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
        </div>
      </main>
    </div>
  )
}
